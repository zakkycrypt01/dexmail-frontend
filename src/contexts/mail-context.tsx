import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mailService, EmailStatus, DraftEmail } from '@/lib/mail-service';
import { Mail } from '@/lib/data';
import { useAccount } from 'wagmi';
import { useAuth } from './auth-context';

interface MailContextType {
    mails: Mail[];
    setMails: (mails: Mail[]) => void;
    refreshMails: () => Promise<void>;
    getEmailStatus: (messageId: string) => EmailStatus;
    updateEmailStatus: (messageId: string, status: Partial<EmailStatus>) => void;
    markAsRead: (messageId: string) => void;
    markAsUnread: (messageId: string) => void;
    moveToSpam: (messageId: string) => void;
    moveToArchive: (messageId: string) => void;
    moveToTrash: (messageId: string) => void;
    restoreFromTrash: (messageId: string) => void;
    addLabel: (messageId: string, label: string) => void;
    removeLabel: (messageId: string, label: string) => void;
    deleteMails: (messageIds: string[]) => void;
    archiveMails: (messageIds: string[]) => void;
    spamMails: (messageIds: string[]) => void;
    addLabelToMails: (messageIds: string[], label: string) => void;
    removeLabelFromMails: (messageIds: string[], label: string) => void;
    saveDraft: (draft: DraftEmail) => void;
    deleteDraft: (id: string) => void;
    isLoading: boolean;
}

const MailContext = createContext<MailContextType | undefined>(undefined);

export function MailProvider({ children }: { children: ReactNode }) {
    const [mails, setMails] = useState<Mail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusVersion, setStatusVersion] = useState(0);
    const { address, isConnected } = useAccount();
    const { user } = useAuth();

    const refreshMails = async (silent = false) => {
        if (!isConnected || !address || !user?.email) {
            setMails([]);
            return;
        }

        if (!silent) setIsLoading(true);
        try {
            // Initialize status cache
            await mailService.initializeStatusCache(user.email);

            // Fetch both inbox and sent emails in parallel
            const [fetchedInbox, fetchedSent, fetchedDrafts] = await Promise.all([
                mailService.getInbox(user.email),
                mailService.getSent(user.email),
                mailService.getDrafts(user.email)
            ]);

            // Map inbox emails
            const inboxMails: Mail[] = fetchedInbox.map(m => {
                const timestamp = parseInt(m.timestamp, 10) * 1000;
                const dateStr = new Date(timestamp).toISOString();
                const status = mailService.getEmailStatus(m.messageId);

                // For inbox: 'from' is the sender, 'to' is the recipient (current user)
                return {
                    id: m.messageId,
                    name: m.from, // Display sender's email in the list
                    email: m.from, // Sender's email for reply-to
                    subject: m.subject,
                    text: (m.body || '').substring(0, 100) + '...',
                    date: dateStr,
                    read: status.read,

                    labels: status.labels || [],
                    status: status.deleted ? 'trash' :
                        status.archived ? 'archive' :
                            status.spam ? 'spam' :
                                status.draft ? 'draft' : 'inbox',
                    body: m.body || '',
                    hasCryptoTransfer: m.hasCryptoTransfer
                };
            });

            // Map sent emails
            const sentMails: Mail[] = fetchedSent.map(m => {
                const timestamp = parseInt(m.timestamp, 10) * 1000;
                const dateStr = new Date(timestamp).toISOString();

                // For sent: 'from' is the sender (current user), 'to' is the recipient
                return {
                    id: m.messageId,
                    name: m.to[0] || 'Unknown', // Display recipient's email in the list
                    email: m.to[0] || '', // Recipient's email
                    subject: m.subject,
                    text: (m.body || '').substring(0, 100) + '...',
                    date: dateStr,
                    read: true, // Sent emails are always "read"
                    labels: [],
                    status: 'sent',
                    body: m.body || '',
                    hasCryptoTransfer: m.hasCryptoTransfer
                };
            });

            // Combine inbox and sent emails
            let allMails = [...inboxMails, ...sentMails];

            // Fetch drafts
            const draftMails: Mail[] = fetchedDrafts.map(d => ({
                id: d.id,
                name: '(Draft)',
                email: d.to,
                subject: d.subject || '(No Subject)',
                text: (d.body || '').substring(0, 100) + '...',
                date: new Date(d.timestamp).toISOString(),
                read: true,
                labels: [],
                status: 'draft',
                body: d.body,
                hasCryptoTransfer: false // Drafts don't have crypto attached yet
            }));

            setMails([...allMails, ...draftMails]);
        } catch (error) {
            console.error('[MailContext] Failed to fetch mails:', error);
            if (!silent) setMails([]);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    // Effect for account/user changes and polling
    useEffect(() => {
        if (user?.email) {
            mailService.cleanupTrash(user.email); // Auto-delete old trash
        }
        refreshMails(false); // Initial load with spinner

        // Poll for new emails every 10 seconds
        const intervalId = setInterval(() => {
            refreshMails(true); // Silent refresh
        }, 10000);

        return () => clearInterval(intervalId);
    }, [isConnected, address, user?.email]);

    // Effect for status changes (silent refresh)
    useEffect(() => {
        if (statusVersion > 0) {
            refreshMails(true);
        }
    }, [statusVersion]);

    const getEmailStatus = (messageId: string): EmailStatus => {
        return mailService.getEmailStatus(messageId);
    };

    const updateEmailStatus = (messageId: string, status: Partial<EmailStatus>) => {
        if (user?.email) {
            mailService.updateEmailStatus(messageId, status, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const markAsRead = (messageId: string) => {
        if (user?.email) {
            mailService.markAsRead(messageId, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const markAsUnread = (messageId: string) => {
        if (user?.email) {
            mailService.markAsUnread(messageId, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const moveToSpam = (messageId: string) => {
        if (user?.email) {
            mailService.moveToSpam(messageId, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const moveToArchive = (messageId: string) => {
        if (user?.email) {
            mailService.moveToArchive(messageId, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const moveToTrash = (messageId: string) => {
        if (!user?.email) return;

        const mail = mails.find(m => m.id === messageId);
        if (mail?.status === 'draft') {
            mailService.deleteDraft(messageId, user.email);
        } else {
            mailService.moveToTrash(messageId, user.email);
        }
        setStatusVersion(v => v + 1);
    };

    const restoreFromTrash = (messageId: string) => {
        if (user?.email) {
            mailService.restoreFromTrash(messageId, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const addLabel = (messageId: string, label: string) => {
        if (user?.email) {
            mailService.addLabel(messageId, label, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const removeLabel = (messageId: string, label: string) => {
        if (user?.email) {
            mailService.removeLabel(messageId, label, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const deleteMails = (messageIds: string[]) => {
        if (!user?.email) return;

        messageIds.forEach(id => {
            const mail = mails.find(m => m.id === id);
            if (mail?.status === 'draft') {
                mailService.deleteDraft(id, user.email);
            } else {
                mailService.moveToTrash(id, user.email);
            }
        });
        setStatusVersion(v => v + 1);
    };

    const archiveMails = (messageIds: string[]) => {
        if (user?.email) {
            messageIds.forEach(id => mailService.moveToArchive(id, user.email));
            setStatusVersion(v => v + 1);
        }
    };

    const spamMails = (messageIds: string[]) => {
        if (user?.email) {
            messageIds.forEach(id => mailService.moveToSpam(id, user.email));
            setStatusVersion(v => v + 1);
        }
    };

    const addLabelToMails = (messageIds: string[], label: string) => {
        if (user?.email) {
            messageIds.forEach(id => mailService.addLabel(id, label, user.email));
            setStatusVersion(v => v + 1);
        }
    };

    const removeLabelFromMails = (messageIds: string[], label: string) => {
        if (user?.email) {
            messageIds.forEach(id => mailService.removeLabel(id, label, user.email));
            setStatusVersion(v => v + 1);
        }
    };

    const saveDraft = (draft: DraftEmail) => {
        if (user?.email) {
            mailService.saveDraft(draft, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    const deleteDraft = (id: string) => {
        if (user?.email) {
            mailService.deleteDraft(id, user.email);
            setStatusVersion(v => v + 1);
        }
    };

    return (
        <MailContext.Provider
            value={{
                mails,
                setMails,
                refreshMails,
                getEmailStatus,
                updateEmailStatus,
                markAsRead,
                markAsUnread,
                moveToSpam,
                moveToArchive,
                moveToTrash,
                restoreFromTrash,
                addLabel,
                removeLabel,
                deleteMails,
                archiveMails,
                spamMails,
                addLabelToMails,
                removeLabelFromMails,
                saveDraft,
                deleteDraft,
                isLoading
            }}
        >
            {children}
        </MailContext.Provider>
    );
}

export function useMail() {
    const context = useContext(MailContext);
    if (context === undefined) {
        throw new Error('useMail must be used within a MailProvider');
    }
    return context;
}
