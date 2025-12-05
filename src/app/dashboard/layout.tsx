'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Edit, Inbox, Star, Settings, PanelLeft, Gift } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComposeDialog } from '@/components/mail/compose-dialog';
import { MailProvider } from '@/contexts/mail-context';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function BottomNavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inbox', href: '/dashboard', icon: Inbox },
    { name: 'Claim', href: '/dashboard/claim', icon: Gift },
    { name: 'Starred', href: '/dashboard/starred', icon: Star },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card text-card-foreground">
      <div className="relative flex h-16 items-center justify-between px-2">
        <div className="flex w-full justify-around">
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 min-w-0 w-1/4 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs truncate">{item.name}</span>
            </Link>
          ))}
        </div>
        <div className="w-16 shrink-0" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <ComposeDialog>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Edit className="h-6 w-6" />
            </Button>
          </ComposeDialog>
        </div>
        <div className="flex w-full justify-around">
          {navItems.slice(2).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 min-w-0 w-1/4 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleSidebar } = useSidebar();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="md:hidden flex flex-col h-screen w-full">
        <main className="flex-1 overflow-auto pb-16">{children}</main>
        <BottomNavBar />
      </div>
      <div className="hidden md:flex h-screen w-full">
        <Sidebar
          collapsible="icon"
          className="border-r border-sidebar-border bg-sidebar"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <AppLogo />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 [&_span]:hidden group-data-[state=expanded]:[&_span]:inline-block"
              onClick={toggleSidebar}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-1 w-full">
          <main className="h-full w-full overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MailProvider>
      <SidebarProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </MailProvider>
  );
}
