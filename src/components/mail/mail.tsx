'use client';

import { mailService } from '@/lib/mail-service';
import { format } from 'date-fns';

import React, { useEffect, useState } from 'react';
import { MailList } from './mail-list';
import { MailDisplay } from './mail-display';
import type { Mail } from '@/lib/data';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '../ui/separator';
import {
  Archive,
  Folder,
  Trash,
  MoreVertical,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { ComposeDialog } from './compose-dialog';
import { Edit } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import Link from 'next/link';
import { useMail } from '@/contexts/mail-context';
import { Tag } from 'lucide-react';
import { useMailLabels } from '@/hooks/use-mail-labels';

interface HeaderProps {
  selectedMailIds: string[];
  onDelete: () => void;
  onArchive: () => void;
  onSpam: () => void;
  onAddLabel: (label: string) => void;
  onRemoveLabel: (label: string) => void;
}

function Header({ selectedMailIds, onDelete, onArchive, onSpam, onAddLabel, onRemoveLabel }: HeaderProps) {
  const labels = useMailLabels();
  const [newLabel, setNewLabel] = useState('');

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {selectedMailIds.length > 0 ? `${selectedMailIds.length} selected` : 'All Messages'}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {selectedMailIds.length > 0 ? (
          <>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onArchive}>
                    <Archive className="h-4 w-4" />
                    <span className="sr-only">Archive</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onSpam}>
                    <MoreVertical className="h-4 w-4" /> {/* Using MoreVertical as generic icon for now, or maybe AlertOctagon for spam */}
                    <span className="sr-only">Mark as Spam</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark as Spam</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onDelete}>
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Tag className="h-4 w-4" />
                  <span className="sr-only">Labels</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Apply Label</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {labels.map((label) => (
                  <DropdownMenuItem key={label.name} onClick={() => onAddLabel(label.name)}>
                    <div className={`h-2 w-2 rounded-full mr-2 ${label.color}`} />
                    {label.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Input
                    placeholder="New label..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLabel.trim()) {
                        onAddLabel(newLabel.trim());
                        setNewLabel('');
                      }
                    }}
                    className="h-8"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            {/* Default actions when nothing selected */}
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </>
        )}
        <Separator orientation="vertical" className="h-6 mx-2" />
        <ComposeDialog>
          <Button>
            <Edit className="mr-2 h-4 w-4" /> Write Message
          </Button>
        </ComposeDialog>
      </div>
    </div>
  );
}

import { useAuth } from '@/contexts/auth-context';

function MobileHeader() {
  const { user, logout } = useAuth();
  const userAvatar = PlaceHolderImages.find(
    (img) => img.id === 'user-avatar-1'
  );

  return (
    <header className="fixed top-0 z-10 flex h-16 items-center justify-between gap-3 border-b bg-background px-4 w-full">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="bg-muted pl-8 h-10 rounded-full" />
      </div>
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage
                  src={userAvatar?.imageUrl}
                  alt="User Avatar"
                  data-ai-hint={userAvatar?.imageHint}
                />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">{user?.email || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.walletAddress
                    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                    : 'No wallet connected'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

// ... (imports remain the same)

export function MailComponent({
  mails: initialMails,
  category = 'all',
  label
}: {
  mails: Mail[];
  category?: 'all' | 'read' | 'unread' | 'sent' | 'drafts' | 'spam' | 'archive' | 'trash';
  label?: string;
}) {
  const { mails, isLoading, deleteMails, archiveMails, spamMails, addLabelToMails, removeLabelFromMails } = useMail();
  const [selectedMailId, setSelectedMailId] = React.useState<string | null>(null);
  const [selectedMailIds, setSelectedMailIds] = React.useState<string[]>([]);
  const [activeCategory, setActiveCategory] = React.useState(category);
  const isMobile = useIsMobile();
  const [fetchedMail, setFetchedMail] = useState<Mail | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { user } = useAuth(); // Need user email for fetching

  // Update activeCategory when prop changes, but only if not in mobile view (or handle differently if needed)
  // For this specific request, we want mobile to control its own state via tabs
  useEffect(() => {
    if (!isMobile) {
      setActiveCategory(category);
    }
  }, [category, isMobile]);


  // Use context mails if available, otherwise use initial mails
  const displayMails = mails.length > 0 ? mails : initialMails;

  const selectedMail = React.useMemo(() => {
    if (!selectedMailId) return null;
    const found = displayMails.find((item) => item.id === selectedMailId);
    if (found) return found;
    return fetchedMail && fetchedMail.id === selectedMailId ? fetchedMail : null;
  }, [selectedMailId, displayMails, fetchedMail]);

  // Filter mails based on activeCategory or label
  const filteredMails = React.useMemo(() => {
    return displayMails.filter((mail) => {
      if (label) {
        return mail.labels && mail.labels.includes(decodeURIComponent(label));
      }

      switch (activeCategory) {
        case 'all':
          return mail.status === 'inbox';
        case 'read':
          return mail.status === 'inbox' && mail.read;
        case 'unread':
          return mail.status === 'inbox' && !mail.read;
        case 'sent':
          return mail.status === 'sent';
        case 'drafts':
          return mail.status === 'draft';
        case 'spam':
          return mail.status === 'spam';
        case 'archive':
          return mail.status === 'archive';
        case 'trash':
          return mail.status === 'trash';
        default:
          return true;
      }
    });
  }, [displayMails, activeCategory, label]);

  const handleSelectMail = (mail: Mail) => {
    // Determine strict equality or just id match
    if (mail.id === selectedMailId) return;

    // Reset fetched mail when selecting a new one from list
    setFetchedMail(null);
    setSelectedMailId(mail.id);
  };

  const handleToggleMailSelection = (mailId: string) => {
    setSelectedMailIds((prev) => {
      const newSelection = prev.includes(mailId)
        ? prev.filter((id) => id !== mailId)
        : [...prev, mailId];
      return newSelection;
    });
  };

  const handleNavigateToMail = async (mailId: string) => {
    if (mailId === selectedMailId) return;

    // 1. Check if mail exists in current view (displayMails)
    const targetMail = displayMails.find(m => m.id === mailId);
    if (targetMail) {
      setFetchedMail(null);
      setSelectedMailId(mailId);
      return;
    }

    // 2. Check if it's the already fetched mail
    if (fetchedMail && fetchedMail.id === mailId) {
      setSelectedMailId(mailId);
      return;
    }

    // 3. Fetch from service if not found
    if (!user?.email) {
      console.warn('Cannot fetch mail: User not authenticated');
      return;
    }

    setIsNavigating(true);
    try {
      console.log('Fetching missing mail:', mailId);
      const message = await mailService.getMessage(mailId, user.email);

      if (message) {
        // Convert EmailMessage to Mail
        const cleanBody = (text: string | null | undefined) => (text || '').replace(/\s*\(?Sent via DexMail - The Decentralized Email Protocol\)?\s*/g, '').trim();
        const cleanedBody = cleanBody(message.body);

        const newMail: Mail = {
          id: message.messageId,
          name: message.from.split('@')[0] || 'Unknown', // Simple name extraction
          email: message.from,
          subject: message.subject,
          text: cleanedBody.slice(0, 100) || '',
          date: new Date(Number(message.timestamp) * 1000).toISOString(),
          read: true, // If we navigate to it, we'll mark it read in display
          labels: [],
          status: 'inbox', // Defaulting to inbox context for viewed mail
          body: cleanedBody,
          hasCryptoTransfer: message.hasCryptoTransfer,
          inReplyTo: message.inReplyTo
        };

        setFetchedMail(newMail);
        setSelectedMailId(mailId);
      } else {
        console.error('Mail not found:', mailId);
      }
    } catch (error) {
      console.error('Error navigating to mail:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleBack = () => {
    setSelectedMailId(null);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full bg-background">
        <MobileHeader />
        <div className="mt-16 flex-1 flex flex-col">
          {!selectedMailId && (
            <div className="px-4 py-2">
              <Tabs value={activeCategory === 'sent' ? 'sent' : 'all'} onValueChange={(val) => setActiveCategory(val as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">Inbox</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
          <div className="flex-1 w-full">
            {isLoading && !selectedMailId ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
            ) : selectedMail ? (
              selectedMail.status === 'draft' ? (
                <ComposeDialog
                  key={selectedMail.id}
                  initialData={{
                    to: selectedMail.email,
                    subject: selectedMail.subject,
                    body: selectedMail.body,
                    id: selectedMail.id
                  }}
                >
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Draft Message</h2>
                      <p className="text-muted-foreground">You are viewing a draft.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="lg">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button size="lg" variant="destructive" onClick={(e) => {
                        e.stopPropagation();
                        deleteMails([selectedMail.id]);
                        setSelectedMailId(null);
                      }}>
                        <Trash className="mr-2 h-4 w-4" /> Discard
                      </Button>
                    </div>
                    <Button variant="ghost" onClick={handleBack} className="mt-4">
                      Back to List
                    </Button>
                  </div>
                </ComposeDialog>
              ) : (
                <MailDisplay mail={selectedMail} onBack={handleBack} onNavigateToMail={handleNavigateToMail} />
              )
            ) : (
              <MailList
                items={filteredMails}
                onSelectMail={handleSelectMail}
                selectedMailId={selectedMailId}
                selectedMailIds={selectedMailIds}
                onToggleMailSelection={handleToggleMailSelection}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <Header
        selectedMailIds={selectedMailIds}
        onDelete={() => {
          deleteMails(selectedMailIds);
          setSelectedMailIds([]);
        }}
        onArchive={() => {
          archiveMails(selectedMailIds);
          setSelectedMailIds([]);
        }}
        onSpam={() => {
          spamMails(selectedMailIds);
          setSelectedMailIds([]);
        }}
        onAddLabel={(label) => {
          addLabelToMails(selectedMailIds, label);
        }}
        onRemoveLabel={(label) => {
          removeLabelFromMails(selectedMailIds, label);
        }}
      />
      <div className="flex-1 w-full">
        {(isLoading || isNavigating) && !selectedMail ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
        ) : selectedMail ? (
          selectedMail.status === 'draft' ? (
            // We need to render the ComposeDialog here.
            // Since ComposeDialog is a Dialog, we can't easily "embed" it in the view pane like MailDisplay.
            // But we can make it open automatically.
            // However, the requirement implies we should be able to "resume editing".
            // Let's render MailList (so user stays on list) and pop up the dialog.
            // To do this, we can use a controlled Dialog or just a key to force re-mount.
            // Let's try to render a special "DraftEditor" component or just reuse ComposeDialog with an auto-open prop?
            // The current ComposeDialog doesn't support "controlled open" from outside easily without refactoring.
            // Let's refactor ComposeDialog to accept `open` prop or just use a key.
            // Actually, let's just show the MailDisplay for now but add a "Resume Editing" button in it?
            // No, standard behavior is opening the editor.
            // Let's render the ComposeDialog *instead* of MailDisplay, but since it's a modal, it will pop up.
            // And we should probably clear selection when it closes?
            // Let's try this:
            <ComposeDialog
              key={selectedMail.id}
              initialData={{
                to: selectedMail.email,
                subject: selectedMail.subject,
                body: selectedMail.body,
                id: selectedMail.id
              }}
            >
              {/* We need a trigger, but we want it to open immediately.
                   We can use a button that we click programmatically?
                   Or better, update ComposeDialog to open if initialData is present?
                   I added logic in ComposeDialog to set state from initialData, but not to auto-open.
                   Let's just show a "Continue Editing" button in the view pane for simplicity and robustness.
               */}
              <div className="flex h-full flex-col items-center justify-center p-8 text-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Draft Message</h2>
                  <p className="text-muted-foreground">You are viewing a draft.</p>
                </div>
                <div className="flex gap-2">
                  <Button size="lg">
                    <Edit className="mr-2 h-4 w-4" /> Continue Editing
                  </Button>
                  <Button size="lg" variant="destructive" onClick={(e) => {
                    e.stopPropagation();
                    deleteMails([selectedMail.id]);
                    setSelectedMailId(null);
                  }}>
                    <Trash className="mr-2 h-4 w-4" /> Discard
                  </Button>
                </div>
              </div>
            </ComposeDialog>
          ) : (
            <MailDisplay mail={selectedMail} onBack={handleBack} onNavigateToMail={handleNavigateToMail} />
          )
        ) : (
          <MailList
            items={filteredMails}
            onSelectMail={handleSelectMail}
            selectedMailId={selectedMailId}
            selectedMailIds={selectedMailIds}
            onToggleMailSelection={handleToggleMailSelection}
          />
        )}
      </div>
    </div>
  );
}
