"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, FileText, Church, Briefcase, BookOpen, LogOut, Menu, CreditCard, UserCheck, Newspaper, Clock, MapPin, Palette, DollarSign, MessageSquare, Mail } from 'lucide-react';
import { useState } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Logo } from '../shared/Logo';

const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/inquiries', label: 'Inquiries', icon: Mail },
  { href: '/admin/financials', label: 'Financial Ledger', icon: DollarSign },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/bulletin', label: 'Bulletin', icon: Newspaper },
  { href: '/admin/profiles', label: 'Staff Profiles', icon: Users },
  { href: '/admin/members', label: 'Members', icon: UserCheck },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/community', label: 'Community', icon: Church },
  { href: '/admin/development', label: 'Development', icon: Briefcase },
  { href: '/admin/bible-readings', label: 'Bible Readings', icon: BookOpen },
  { href: '/admin/masses', label: 'Mass Schedule', icon: Clock },
  { href: '/admin/users', label: 'App Users', icon: Users },
  { href: '/admin/payments', label: 'Payment Settings', icon: CreditCard },
  { href: '/admin/branding', label: 'Site Branding', icon: Palette },
  { href: '/admin/contact', label: 'Contact Info', icon: MapPin },
];

export function AdminSidebar({ onLogout }: { onLogout: () => void; }) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  // Unread Inquiries Badge Logic
  const unreadInquiriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inquiries'), where('status', '==', 'unread'));
  }, [firestore]);
  const { data: unreadInquiries } = useCollection(unreadInquiriesQuery);
  const unreadCount = unreadInquiries?.length || 0;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
         <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </Trigger>
          <SheetContent side="left" className="p-0 w-72 sm:max-w-xs">
            <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">Admin Menu</SheetTitle>
                <div className="flex items-center gap-3">
                    <Logo url={settings?.logoUrl} />
                    <span className="font-bold text-lg truncate">{settings?.brandName || 'St. Martin De Porres'}</span>
                </div>
            </SheetHeader>
            <nav className="flex flex-col h-full bg-card text-card-foreground">
              <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                {adminNavLinks.map(link => (
                    <SidebarLink 
                      key={link.href + link.label} 
                      {...link} 
                      badge={link.label === 'Inquiries' ? unreadCount : 0}
                      onClick={() => isSheetOpen && setSheetOpen(false)} 
                    />
                ))}
              </div>
              <div className="p-2 border-t mt-auto">
                <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => { onLogout(); setSheetOpen(false); }}>
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex justify-end">
             <Logo url={settings?.logoUrl} className="h-8 w-8" />
        </div>
      </header>

      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:bg-card">
         <div className="flex flex-col h-full bg-card text-card-foreground">
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto pt-4">
                {adminNavLinks.map(link => (
                    <SidebarLink 
                      key={link.href + link.label} 
                      {...link} 
                      badge={link.label === 'Inquiries' ? unreadCount : 0}
                    />
                ))}
            </nav>
            <div className="p-2 border-t">
                <Button variant="ghost" className="w-full justify-start gap-3" onClick={onLogout}>
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </Button>
            </div>
        </div>
      </aside>
    </>
  );
}

const SidebarLink = ({ href, label, icon: Icon, onClick, badge }: { href: string; label: string; icon: React.ElementType, onClick?: () => void, badge?: number }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2 transition-all text-sm font-medium',
        isActive 
            ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' 
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      {badge && badge > 0 ? (
        <span className="ml-auto bg-destructive text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-in zoom-in duration-300">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  );
};