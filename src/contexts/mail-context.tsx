import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mailService, EmailStatus } from '@/lib/mail-service';
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
            // Fetch both inbox and sent emails in parallel
            const [fetchedInbox, fetchedSent] = await Promise.all([
                mailService.getInbox(user.email),
                mailService.getSent(user.email)
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
                    labels: [],
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
            setMails([...inboxMails, ...sentMails]);
        } catch (error) {
            console.error('[MailContext] Failed to fetch mails:', error);
            if (!silent) setMails([]);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    // Effect for account/user changes and polling
    useEffect(() => {
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
        mailService.updateEmailStatus(messageId, status);
        setStatusVersion(v => v + 1);
    };

    const markAsRead = (messageId: string) => {
        mailService.markAsRead(messageId);
        setStatusVersion(v => v + 1);
    };

    const markAsUnread = (messageId: string) => {
        mailService.markAsUnread(messageId);
        setStatusVersion(v => v + 1);
    };

    const moveToSpam = (messageId: string) => {
        mailService.moveToSpam(messageId);
        setStatusVersion(v => v + 1);
    };

    const moveToArchive = (messageId: string) => {
        mailService.moveToArchive(messageId);
        setStatusVersion(v => v + 1);
    };

    const moveToTrash = (messageId: string) => {
        mailService.moveToTrash(messageId);
        setStatusVersion(v => v + 1);
    };

    const restoreFromTrash = (messageId: string) => {
        mailService.restoreFromTrash(messageId);
        setStatusVersion(v => v + 1);
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
