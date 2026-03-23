"use client";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from "react";
import { useUser, useFirestore, useMemoFirebase, useDoc, useAuth } from "@/firebase";
import type { RegisteredUser, SiteSettings } from "@/lib/types";
import { PasskeyModal } from "@/components/admin/PasskeyModal";
import { PresenceManager } from "@/components/shared/PresenceManager";
import { Logo } from "@/components/shared/Logo";
import { doc } from "firebase/firestore";
import Link from 'next/link';

/**
 * Admin Layout Client Wrapper
 * Handles auth redirection, presence, and navigation state.
 * Prevents session bounce by monitoring isRedirecting state.
 */
export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, isRedirecting } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<RegisteredUser>(userProfileRef);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const isSuperAdmin = user?.email === 'kimaniemma20@gmail.com' || user?.uid === 'BKSmmIdohYQHlao5V9eZ9JQyaEV2';
  const isAdmin = userProfile?.isAdmin === true || isSuperAdmin;
  
  const isVerifying = isUserLoading || isRedirecting || (user && isProfileLoading);
  
  useEffect(() => {
    if (!isVerifying && !user) {
      router.replace('/login');
    }
  }, [user, isVerifying, router]);

  useEffect(() => {
    if (!isVerifying && isAdmin && pathname === '/admin') {
      router.replace('/admin/dashboard');
    }
  }, [isAdmin, pathname, router, isVerifying]);

  const handleLogout = () => {
    router.push('/');
  }

  if(isVerifying) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-white">
            <div className="animate-pulse flex flex-col items-center gap-6">
                <Logo url={settings?.logoUrl} className="h-24 w-24 grayscale opacity-50" />
                <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground">Securing Session</p>
                    <div className="h-0.5 w-12 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-1/2 animate-[progress_1.5s_infinite_ease-in-out]" />
                    </div>
                </div>
            </div>
        </div>
    );
  }
  
  const showPasskeyModal = user && !isAdmin && pathname !== '/admin';

  if (isAdmin) {
    if (pathname === '/admin') return null;
    return (
      <div className="flex flex-col min-h-screen bg-muted/40 animate-in fade-in duration-500 overflow-hidden isolate">
          <PresenceManager />
          
          <header className="hidden md:flex sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8">
            <div className="flex h-16 items-center w-full justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Logo url={settings?.logoUrl} />
                    <span className="font-bold text-lg">{settings?.brandName || 'St. Martin De Porres'}</span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">Admin Portal</span>
                        <span className="text-xs font-medium text-primary">{user?.email}</span>
                    </div>
                </div>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            <AdminSidebar onLogout={handleLogout} />
            <main className="flex-1 overflow-y-auto p-4 sm:px-6 md:p-8 relative">
                <div className="max-w-7xl mx-auto pb-20">
                    {children}
                </div>
            </main>
          </div>
      </div>
    );
  }

  if (showPasskeyModal) {
     return <PasskeyModal />
  }

  return <main className="animate-in fade-in duration-500">{children}</main>;
}
