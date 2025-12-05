import { EmailMessage, CryptoAsset } from './types';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from './wagmi-config';
import { BASEMAILER_ADDRESS, baseMailerAbi } from './contracts';
import { parseUnits, parseEther, stringToHex } from 'viem';
import { cryptoService } from './crypto-service';
import { generateClaimCode, storeClaimCode, getClaimUrl, formatClaimCode } from './claim-code';

export interface SendEmailData {
  from: string;
  to: string[];
  subject: string;
  body: string;
  cryptoTransfer?: {
    enabled: boolean;
    assets: CryptoAsset[];
  };
}

export interface SendEmailResponse {
  messageId: string;
  cid: string;
  key: string;
}

export interface EmailStatus {
  read: boolean;
  spam: boolean;
  archived: boolean;
  deleted: boolean;
  draft: boolean;
}

const EMAIL_STATUS_KEY = 'dexmail_email_status';


class MailService {
  async sendEmail(data: SendEmailData): Promise<SendEmailResponse & { claimCode?: string; isDirectTransfer?: boolean }> {
    let isRecipientRegistered = false;
    let isWalletDeployed = false;

    if (data.cryptoTransfer?.enabled && data.cryptoTransfer.assets.length > 0 && data.to.length > 0) {
      try {
        const recipient = data.to[0];
        const registrationStatus = await readContract(wagmiConfig, {
          address: BASEMAILER_ADDRESS,
          abi: baseMailerAbi,
          functionName: 'isRecipientRegistered',
          args: [recipient]
        }) as [boolean, boolean];

        isRecipientRegistered = registrationStatus[0];
        isWalletDeployed = registrationStatus[1];

        console.log('[MailService] Recipient registration status:', {
          email: recipient,
          registered: isRecipientRegistered,
          walletDeployed: isWalletDeployed
        });
      } catch (error) {
        console.warn('[MailService] Could not check recipient registration:', error);
      }
    }

    let claimCode: string | undefined;
    const isDirectTransfer = isRecipientRegistered && isWalletDeployed;

    if (data.cryptoTransfer?.enabled && data.cryptoTransfer.assets.length > 0 && !isRecipientRegistered) {
      claimCode = generateClaimCode();
      console.log('[MailService] Generated claim code for unregistered user:', claimCode);
    }

    let emailBody = data.body;
    if (data.cryptoTransfer?.enabled && data.cryptoTransfer.assets.length > 0) {
      const assetsText = data.cryptoTransfer.assets.map(asset => {
        if (asset.type === 'eth') return `${asset.amount} ETH`;
        if (asset.type === 'erc20') return `${asset.amount} ${asset.symbol || 'tokens'}`;
        if (asset.type === 'nft') return `NFT #${asset.tokenId}`;
        return 'Unknown asset';
      }).join(', ');

      emailBody += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      emailBody += `🎁 CRYPTO ASSETS ATTACHED\n`;
      emailBody += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      emailBody += `You've received: ${assetsText}\n\n`;

      if (isDirectTransfer) {
        emailBody += `✅ Assets have been transferred directly to your wallet!\n\n`;
        emailBody += `You can view them in your DexMail dashboard.\n`;
      } else if (claimCode) {
        const claimUrl = getClaimUrl(claimCode);

        emailBody += `Your Claim Code: ${formatClaimCode(claimCode)}\n\n`;
        emailBody += `To claim your assets:\n`;
        emailBody += `1. Click this link: ${claimUrl}\n`;
        emailBody += `2. Or manually enter the claim code: ${claimCode}\n\n`;
        emailBody += `This code will auto-fill when you click the link above.\n`;
      }

      emailBody += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    }

    // 1. Upload to IPFS via API route
    const ipfsResponse = await fetch('/api/ipfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: data.from,
        to: data.to,
        subject: data.subject,
        body: emailBody,
        timestamp: new Date().toISOString(),
        cryptoTransfer: data.cryptoTransfer,
        claimCode: claimCode,
        isDirectTransfer: isDirectTransfer
      })
    });

    if (!ipfsResponse.ok) {
      throw new Error('Failed to upload email to IPFS');
    }

    const { cid } = await ipfsResponse.json();
    console.log('[MailService] Uploaded to IPFS with CID:', cid);

    let txHash = '';
    const transferHashes: string[] = [];

    if (!cid) {
      throw new Error('Failed to get CID from IPFS upload');
    }

    const cidHex = stringToHex(cid);
    const cidBytes32 = cidHex.slice(0, 66).padEnd(66, '0') as `0x${string}`;

    console.log('[MailService] Generated CID hash:', cidBytes32);

    try {
      const storeResponse = await fetch('/api/cid/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cidHash: cidBytes32,
          fullCid: cid
        })
      });

      if (storeResponse.ok) {
        console.log('[MailService] ✅ Stored CID mapping in MongoDB:', cidBytes32, '->', cid);
      } else {
        console.warn('[MailService] Failed to store CID in MongoDB, using localStorage fallback');
      }
    } catch (apiError) {
      console.error('[MailService] Error calling CID store API:', apiError);
    }

    if (typeof window !== 'undefined') {
      try {
        const cidMap = JSON.parse(localStorage.getItem('ipfs_cid_map') || '{}');
        cidMap[cidBytes32] = cid;
        localStorage.setItem('ipfs_cid_map', JSON.stringify(cidMap));
        console.log('[MailService] Stored CID mapping in localStorage (fallback):', cidBytes32, '->', cid);
      } catch (e) {
        console.error('[MailService] Failed to store CID mapping in localStorage:', e);
      }
    }


    const recipient = data.to[0];
    const isExternal = recipient.includes('@') && !recipient.endsWith('@dexmail.app');

    if (data.cryptoTransfer?.enabled && data.cryptoTransfer.assets.length > 0) {
      const asset = data.cryptoTransfer.assets[0];

      console.log(`Sending mail with crypto asset: ${asset.amount} ${asset.symbol}`);

      let amount = BigInt(0);
      let tokenAddress = asset.token || '0x0000000000000000000000000000000000000000';
      const isNft = asset.type === 'nft';

      if (asset.type === 'eth') {
        amount = parseEther(asset.amount || '0');
      } else if (asset.type === 'erc20') {
        amount = parseUnits(asset.amount || '0', 18);
      } else if (asset.type === 'nft') {
        amount = BigInt(asset.tokenId || '0');
        tokenAddress = asset.token!;
      }

      if (asset.type === 'erc20') {
        await cryptoService.ensureApproval(tokenAddress, amount);
      }

      txHash = await writeContract(wagmiConfig, {
        address: BASEMAILER_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'sendMailWithCrypto',
        args: [
          cid,
          recipient,
          isExternal,
          tokenAddress,
          amount,
          isNft
        ],
        value: asset.type === 'eth' ? amount : BigInt(0)
      });

      console.log('[MailService] Sent mail with crypto. Tx:', txHash);
      transferHashes.push(txHash);

      if (data.cryptoTransfer.assets.length > 1) {
        for (let i = 1; i < data.cryptoTransfer.assets.length; i++) {
          const extraAsset = data.cryptoTransfer.assets[i];
          console.log(`Sending additional asset: ${extraAsset.symbol}`);
          const result = await cryptoService.sendCrypto({
            recipientEmail: recipient,
            senderEmail: data.from,
            assets: [extraAsset]
          });
          transferHashes.push(result.claimToken);
        }
      }

    } else if (data.to.length > 0) {
      txHash = await writeContract(wagmiConfig, {
        address: BASEMAILER_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'indexMail',
        args: [cid, recipient, "", isExternal, false]
      });
      console.log('[MailService] Indexed mail on blockchain with tx:', txHash);
    }

    if (claimCode && data.cryptoTransfer?.assets) {
      const recipient = data.to[0];
      storeClaimCode(
        claimCode,
        txHash,
        recipient,
        data.from,
        data.cryptoTransfer.assets,
        isRecipientRegistered,
        isDirectTransfer
      );
    }
    if (isExternal) {
      try {
        console.log('--------------------------------------------------');
        console.log('[Bridge] 🌉 EXTERNAL MAIL DETECTED');
        console.log('[Bridge] 📤 Relaying via SendGrid Bridge...');
        console.log('[Bridge] 📧 Recipient:', recipient);
        console.log('[Bridge] 📨 Sender (Reply-To):', data.from);

        const sendGridResponse = await fetch('/api/sendgrid/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            from: data.from,
            replyTo: data.from, 
            subject: data.subject,
            text: emailBody,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .footer { margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    ${emailBody.replace(/\n/g, '<br/>')}
    <div class="footer">
      <p>Sent via DexMail - The Decentralized Email Protocol</p>
    </div>
  </div>
</body>
</html>`
          })
        });

        if (sendGridResponse.ok) {
          console.log('[Bridge] ✅ Successfully relayed via SendGrid');
          console.log('--------------------------------------------------');
        } else {
          console.warn('[Bridge] ❌ Failed to relay via SendGrid:', await sendGridResponse.text());
          console.log('--------------------------------------------------');
        }
      } catch (sgError) {
        console.error('[MailService] Error sending via SendGrid:', sgError);
      }
    }

    return {
      messageId: txHash,
      cid: cid,
      key: 'mock-key',
      claimCode,
      isDirectTransfer
    };
  }

  private async fetchEmailFromIPFS(cidHash: string): Promise<{ subject: string; body: string; from?: string } | null> {
    try {
      console.log('[MailService] fetchEmailFromIPFS called with CID hash:', cidHash);

      if (cidHash === '0x' + '0'.repeat(64)) {
        console.log('[MailService] Skipping dummy CID');
        return null;
      }

      let actualCid: string | undefined;

      if (!cidHash.startsWith('0x')) {
        actualCid = cidHash;
        console.log('[MailService] Input is already a full CID, skipping lookup:', actualCid);
      } else {
        try {
          const retrieveResponse = await fetch(`/api/cid/retrieve?cidHash=${encodeURIComponent(cidHash)}`);

          if (retrieveResponse.ok) {
            const data = await retrieveResponse.json();
            actualCid = data.fullCid;
            console.log('[MailService] ✅ Retrieved CID from MongoDB:', { cidHash, actualCid });
          } else if (retrieveResponse.status === 404) {
            console.log('[MailService] CID not found in MongoDB, trying localStorage fallback');
          } else {
            console.warn('[MailService] MongoDB API error, trying localStorage fallback');
          }
        } catch (apiError) {
          console.error('[MailService] Error calling CID retrieve API:', apiError);
        }

        if (!actualCid && typeof window !== 'undefined') {
          try {
            const cidMap = JSON.parse(localStorage.getItem('ipfs_cid_map') || '{}');
            actualCid = cidMap[cidHash];
            if (actualCid) {
              console.log('[MailService] Retrieved CID from localStorage (fallback):', { cidHash, actualCid });
            }
          } catch (e) {
            console.error('[MailService] Failed to parse localStorage CID map:', e);
          }
        }
      }

      if (!actualCid) {
        console.warn('[MailService] ⚠️ Could not retrieve CID from MongoDB or localStorage:', cidHash);
        console.warn('[MailService] This means the email content cannot be retrieved from IPFS');
        return null;
      }

      const gatewayUrl = `https://ipfs.io/ipfs/${actualCid}`;
      console.log('[MailService] Fetching from IPFS:', gatewayUrl);

      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        console.error(`[MailService] Failed to fetch from IPFS: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      console.log('[MailService] ✅ Successfully fetched email from IPFS:', { subject: data.subject, bodyLength: data.body?.length });

      return {
        subject: data.subject || 'No Subject',
        body: data.body || '',
        from: data.from
      };
    } catch (error) {
      console.error('[MailService] Error fetching from IPFS:', error);
      return null;
    }
  }

  async getInbox(email: string): Promise<EmailMessage[]> {
    try {
      console.log(`[MailService] Fetching inbox for: ${email}`);
      console.log(`[MailService] Contract address: ${BASEMAILER_ADDRESS}`);

      const { getAccount, getChainId } = await import('@wagmi/core');
      const account = getAccount(wagmiConfig);
      const chainId = getChainId(wagmiConfig);

      console.log(`[MailService] Connected account: ${account.address}`);
      console.log(`[MailService] Chain ID: ${chainId} (Base Sepolia = 84532)`);

      const mailIds = await readContract(wagmiConfig, {
        address: BASEMAILER_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'getInbox',
        args: [email]
      }) as bigint[];

      console.log(`[MailService] Found ${mailIds.length} mail(s) in inbox`);
      console.log(`[MailService] Mail IDs:`, mailIds);

      if (mailIds.length === 0) {
        console.log('[MailService] Inbox is empty - no mails indexed yet');
        return [];
      }

      const messages: EmailMessage[] = [];

      for (const id of mailIds) {
        try {
          console.log(`[MailService] Fetching mail ID: ${id}`);

          const mail = await readContract(wagmiConfig, {
            address: BASEMAILER_ADDRESS,
            abi: baseMailerAbi,
            functionName: 'getMail',
            args: [id]
          }) as any;

          console.log(`[MailService] Mail ${id} - CID: ${mail.cid}, Sender: ${mail.sender}`);

          let senderEmail = mail.sender;
          try {
            const emailFromAddress = await readContract(wagmiConfig, {
              address: BASEMAILER_ADDRESS,
              abi: baseMailerAbi,
              functionName: 'addressToEmail',
              args: [mail.sender]
            }) as string;

            if (emailFromAddress && emailFromAddress.trim() !== '') {
              senderEmail = emailFromAddress;
              console.log(`[MailService] Resolved sender address ${mail.sender} to email: ${senderEmail}`);
            }
          } catch (error) {
            console.warn(`[MailService] Could not resolve email for address ${mail.sender}, using address as fallback`);
          }

          const ipfsContent = await this.fetchEmailFromIPFS(mail.cid);

          const subject = ipfsContent?.subject || 'Email from blockchain';
          const body = ipfsContent?.body || 'This email was sent via DexMail';

          const finalSender = (mail.isExternal && mail.originalSender) ? mail.originalSender : senderEmail;

          messages.push({
            messageId: id.toString(),
            from: finalSender,
            to: [mail.recipientEmail],
            subject: subject,
            body: body,
            timestamp: mail.timestamp.toString(),
            hasCryptoTransfer: mail.hasCrypto,
            ipfsCid: mail.cid
          });
        } catch (mailError) {
          console.error(`[MailService] Error fetching mail ID ${id}:`, mailError);
        }
      }

      console.log(`[MailService] Successfully fetched ${messages.length} message(s)`);
      return messages.reverse();
    } catch (error: any) {
      if (error?.name === 'ContractFunctionZeroDataError' ||
        error?.cause?.name === 'ContractFunctionZeroDataError' ||
        error?.message?.includes('returned no data')) {
        console.log('[MailService] Contract returned no data - treating as empty inbox');
        console.log('[MailService] This could mean:');
        console.log('  1. No emails have been sent to this address yet');
        console.log('  2. Wrong network (make sure you are on Base)');
        console.log('  3. Contract not deployed at this address');
        return [];
      }

      console.error('[MailService] Error fetching inbox:', error);
      console.error('[MailService] Error details:', {
        name: error?.name,
        message: error?.message,
        cause: error?.cause
      });
      throw error;
    }
  }

  async getSent(email: string): Promise<EmailMessage[]> {
    try {
      console.log(`[MailService] Fetching sent emails for: ${email}`);

      const { getAccount } = await import('@wagmi/core');
      const account = getAccount(wagmiConfig);

      if (!account.address) {
        console.log('[MailService] No wallet connected');
        return [];
      }

      const { getPublicClient } = await import('@wagmi/core');
      const publicClient = getPublicClient(wagmiConfig);

      if (!publicClient) {
        console.log('[MailService] No public client available');
        return [];
      }

      const currentBlock = await publicClient.getBlockNumber();

      const fromBlock = currentBlock > BigInt(50000) ? currentBlock - BigInt(50000) : BigInt(0);

      console.log(`[MailService] Querying MailSent events from block ${fromBlock} to ${currentBlock}`);

      const logs = await publicClient.getLogs({
        address: BASEMAILER_ADDRESS,
        event: {
          type: 'event',
          name: 'MailSent',
          inputs: [
            { type: 'uint256', name: 'mailId', indexed: true },
            { type: 'address', name: 'sender', indexed: true },
            { type: 'string', name: 'recipient' },
            { type: 'string', name: 'cid' },
            { type: 'string', name: 'originalSender' }
          ]
        },
        args: {
          sender: account.address
        },
        fromBlock: fromBlock,
        toBlock: currentBlock
      });

      console.log(`[MailService] Found ${logs.length} sent mail event(s)`);

      const messages: EmailMessage[] = [];

      for (const log of logs) {
        try {
          const mailId = log.args.mailId as bigint;
          const recipient = log.args.recipient as string;
          const cidHash = log.args.cid as string;

          const mail = await readContract(wagmiConfig, {
            address: BASEMAILER_ADDRESS,
            abi: baseMailerAbi,
            functionName: 'getMail',
            args: [mailId]
          }) as any;

          const ipfsContent = await this.fetchEmailFromIPFS(cidHash);

          const subject = ipfsContent?.subject || 'Sent Email';
          const body = ipfsContent?.body || '';

          messages.push({
            messageId: mailId.toString(),
            from: email,
            to: [recipient],
            subject: subject,
            body: body,
            timestamp: mail.timestamp.toString(),
            hasCryptoTransfer: mail.hasCrypto,
            ipfsCid: cidHash
          });
        } catch (mailError) {
          console.error(`[MailService] Error processing sent mail:`, mailError);
        }
      }

      console.log(`[MailService] Successfully fetched ${messages.length} sent message(s)`);
      return messages.reverse();
    } catch (error) {
      console.error('[MailService] Error fetching sent emails:', error);
      return [];
    }
  }

  async getMessage(messageId: string, email: string): Promise<EmailMessage> {
    const mail = await readContract(wagmiConfig, {
      address: BASEMAILER_ADDRESS,
      abi: baseMailerAbi,
      functionName: 'getMail',
      args: [BigInt(messageId)]
    }) as any;

    return {
      messageId: messageId,
      from: mail.sender,
      to: [mail.recipientEmail],
      subject: 'Loading...',
      body: 'Loading...',
      timestamp: mail.timestamp.toString(),
      hasCryptoTransfer: mail.hasCrypto,
      ipfsCid: mail.cid
    };
  }

  async deleteMessage(messageId: string, email: string): Promise<{ success: boolean; messageId: string }> {
    return { success: true, messageId };
  }

  private getStatusMap(): Record<string, EmailStatus> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(EMAIL_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private saveStatusMap(statusMap: Record<string, EmailStatus>): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(EMAIL_STATUS_KEY, JSON.stringify(statusMap));
  }

  getEmailStatus(messageId: string): EmailStatus {
    const statusMap = this.getStatusMap();
    return statusMap[messageId] || {
      read: false,
      spam: false,
      archived: false,
      deleted: false,
      draft: false
    };
  }

  updateEmailStatus(messageId: string, status: Partial<EmailStatus>): void {
    const statusMap = this.getStatusMap();
    const currentStatus = this.getEmailStatus(messageId);
    statusMap[messageId] = { ...currentStatus, ...status };
    this.saveStatusMap(statusMap);
  }

  markAsRead(messageId: string): void {
    this.updateEmailStatus(messageId, { read: true });
  }

  markAsUnread(messageId: string): void {
    this.updateEmailStatus(messageId, { read: false });
  }

  moveToSpam(messageId: string): void {
    this.updateEmailStatus(messageId, { spam: true, archived: false, deleted: false });
  }

  removeFromSpam(messageId: string): void {
    this.updateEmailStatus(messageId, { spam: false });
  }

  moveToArchive(messageId: string): void {
    this.updateEmailStatus(messageId, { archived: true, spam: false, deleted: false });
  }

  removeFromArchive(messageId: string): void {
    this.updateEmailStatus(messageId, { archived: false });
  }

  moveToTrash(messageId: string): void {
    this.updateEmailStatus(messageId, { deleted: true, spam: false, archived: false });
  }

  restoreFromTrash(messageId: string): void {
    this.updateEmailStatus(messageId, { deleted: false });
  }

  markAsDraft(messageId: string): void {
    this.updateEmailStatus(messageId, { draft: true });
  }

  removeDraftStatus(messageId: string): void {
    this.updateEmailStatus(messageId, { draft: false });
  }

}

export const mailService = new MailService();
export default MailService;
