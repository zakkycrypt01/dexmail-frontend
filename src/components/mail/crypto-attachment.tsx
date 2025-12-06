'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { nftService } from '@/lib/nft-service';
import { X, Loader2 } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { tokenService } from '@/lib/token-service';

export type Asset = {
  type: 'erc20' | 'nft' | 'eth';
  symbol: string;
  amount: string;
  contract?: string;
  tokenId?: string;
};

type CryptoAttachmentProps = {
  assets: Asset[];
  onChange: (assets: Asset[]) => void;
};

export function CryptoAttachment({ assets, onChange }: CryptoAttachmentProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const { data: ethBalance } = useBalance({ address });
  const [assetType, setAssetType] = useState('erc20');
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [selectedNftId, setSelectedNftId] = useState('');
  const [amount, setAmount] = useState('');

  // Fetch Tokens
  const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ['tokens', address],
    queryFn: async () => {
      if (!address) return [];
      return await tokenService.getTokens(address);
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch NFTs
  const { data: nfts = [], isLoading: isLoadingNfts } = useQuery({
    queryKey: ['nfts', address],
    queryFn: async () => {
      if (!address) return [];
      return await nftService.getNfts(address);
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const addAsset = () => {
    if (assetType === 'erc20' && amount && selectedTokenId) {
      const token = tokens.find(t => t.id === selectedTokenId);
      if (token) {
        if (parseFloat(amount) > parseFloat(token.balance)) {
          toast({
            title: "Insufficient Balance",
            description: `You only have ${parseFloat(token.balance).toFixed(4)} ${token.symbol}.`,
            variant: "destructive",
          });
          return;
        }

        onChange([...assets, {
          type: 'erc20',
          symbol: token.symbol,
          amount,
          contract: token.contractAddress
        }]);
        setAmount('');
        setSelectedTokenId('');
      }
    } else if (assetType === 'eth' && amount) {
      if (ethBalance && parseFloat(amount) > parseFloat(ethBalance.formatted)) {
        toast({
          title: "Insufficient Balance",
          description: `You only have ${parseFloat(ethBalance.formatted).toFixed(4)} ETH.`,
          variant: "destructive",
        });
        return;
      }

      onChange([...assets, { type: 'eth', symbol: 'ETH', amount }]);
      setAmount('');
    } else if (assetType === 'nft' && selectedNftId) {
      const nft = nfts.find(n => n.id === selectedNftId);
      if (nft) {
        // Parse contract and tokenId from ID (format: contract-tokenId)
        const [contract, tokenId] = nft.id.split('-');
        onChange([
          ...assets,
          {
            type: 'nft',
            symbol: 'NFT',
            amount: '1',
            contract: contract,
            tokenId: tokenId,
          },
        ]);
        setSelectedNftId('');
      }
    }
  };

  const removeAsset = (index: number) => {
    onChange(assets.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Select value={assetType} onValueChange={setAssetType}>
          <SelectTrigger>
            <SelectValue placeholder="Asset type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="erc20">ERC20 Token</SelectItem>
            <SelectItem value="eth">ETH</SelectItem>
            <SelectItem value="nft">NFT</SelectItem>
          </SelectContent>
        </Select>

        {assetType === 'erc20' && (
          <>
            <Select value={selectedTokenId} onValueChange={setSelectedTokenId}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTokens ? "Loading tokens..." : "Select Token"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTokens ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : tokens.length > 0 ? (
                  tokens.map(token => (
                    <SelectItem key={token.id} value={token.id}>
                      {token.symbol} ({parseFloat(token.balance).toFixed(4)})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No tokens found
                  </div>
                )}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </>
        )}

        {assetType === 'eth' && (
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="md:col-span-2"
          />
        )}

        {assetType === 'nft' && (
          <div className="md:col-span-2">
            <Select value={selectedNftId} onValueChange={setSelectedNftId}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingNfts ? "Loading NFTs..." : "Select NFT"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingNfts ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : nfts.length > 0 ? (
                  nfts.map(nft => (
                    <SelectItem key={nft.id} value={nft.id}>
                      {nft.name} ({nft.collection})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No NFTs found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button onClick={addAsset} size="sm" disabled={
        (assetType === 'erc20' && (!amount || !selectedTokenId)) ||
        (assetType === 'eth' && !amount) ||
        (assetType === 'nft' && !selectedNftId)
      }>
        Add Asset
      </Button>

      {assets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Assets:</h4>
          <div className="flex flex-wrap gap-2">
            {assets.map((asset, i) => (
              <Badge key={i} variant="secondary" className="flex items-center gap-1.5 pr-1">
                {asset.type === 'nft' ? `NFT: ${asset.contract?.substring(0, 6)}...` : `${asset.amount} ${asset.symbol}`}
                <button
                  onClick={() => removeAsset(i)}
                  className="rounded-full hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
