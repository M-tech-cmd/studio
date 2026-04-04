"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, User, Shield, LogOut, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { useAuth, useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteSettings, RegisteredUser } from '@/lib/types';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/shared/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/events', label: 'Events' },
    { href: '/bulletin', label: 'Bulletin' },
    { href: '/community', label: 'Community' },
    { href: '/ministries', label: 'Ministries' },
    { href: '/development', label: 'Development' },
    { href: '/bible-readings', label: 'Bible Readings' },
    { href: '/documents', label: 'Documents' },
    { href: '/payments', label: 'Payments' },
    { href: '/contact', label: 'Contact' },
  ];

export function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const userDocRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<RegisteredUser>(userDocRef);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleLogout = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const isRealUser = user && !user.isAnonymous;

  // Identity logic: Use masked name if hideRealName is true
  const displayIdentity = userProfile?.hideRealName 
    ? `St. Martin De Porres ${userProfile.customTitle || 'Admin'}`
    : (userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Member');

  const userNavigation = (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden border-2 border-primary/10">
                <Avatar className="h-full w-full">
                  <AvatarImage 
                    src={user?.photoURL || userProfile?.photoURL || undefined} 
                    alt={displayIdentity} 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {displayIdentity.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {isRealUser && (
            <TooltipContent>
              <p>{displayIdentity}</p>
            </TooltipContent>
          )}
        </Tooltip>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          {isRealUser ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayIdentity}</p>
                  {user.email && <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem onSelect={() => router.push('/register-profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/chat')}>
                <MessageCircle className="mr-2 h-4 w-4" />
                <span>Private Chat</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/admin')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => router.push('/login')}>
                Sign In
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/signup')}>
                Sign Up
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Logo url={settings?.logoUrl} />
          <span 
            className="hidden sm:inline-block font-bold text-lg"
            style={{ color: '#1e3a5f' }}
          >
            {settings?.brandName || 'St. Martin De Porres'}
          </span>
        </Link>
        <nav className="hidden lg:flex gap-6 overflow-x-auto no-scrollbar">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary whitespace-nowrap',
                pathname === link.href ? 'text-primary font-bold' : 'text-[#1e3a5f]/70'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex">
             {isClient ? userNavigation : <Skeleton className="h-8 w-8 rounded-full" />}
          </div>
          {isClient ? (
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-[#1e3a5f]">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b">
                      <SheetTitle className="sr-only">Main Menu</SheetTitle>
                       <div className="flex items-center justify-between">
                          <Link href="/" className="flex items-center gap-2" onClick={() => setSheetOpen(false)}>
                          <Logo url={settings?.logoUrl} />
                          <span className="font-bold text-[#1e3a5f]">{settings?.brandName || 'St. Martin De Porres'}</span>
                          </Link>
                      </div>
                  </SheetHeader>
                <ScrollArea className="flex-1">
                  <nav className="flex flex-col gap-4 p-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          'text-lg font-medium transition-colors hover:text-primary',
                          pathname === link.href ? 'text-primary' : 'text-[#1e3a5f]/80'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                   <div className="p-4 border-t space-y-4 pb-10">
                    <div className="sm:hidden">
                      {isRealUser ? (
                         <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3 px-2">
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarImage src={user?.photoURL || userProfile?.photoURL || undefined} alt={displayIdentity} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {displayIdentity.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-bold truncate text-sm">{displayIdentity}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" asChild><Link href="/register-profile" onClick={() => setSheetOpen(false)}>My Profile</Link></Button>
                            <Button variant="outline" asChild><Link href="/chat" onClick={() => setSheetOpen(false)}>Private Chat</Link></Button>
                            <Button variant="outline" asChild><Link href="/admin" onClick={() => setSheetOpen(false)}>Admin Portal</Link></Button>
                            <Button variant="ghost" onClick={() => { handleLogout(); setSheetOpen(false); }}>Logout</Button>
                          </div>
                         </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Button asChild onClick={() => setSheetOpen(false)}><Link href="/login">Sign In</Link></Button>
                          <Button variant="secondary" asChild onClick={() => setSheetOpen(false)}><Link href="/signup">Sign Up</Link></Button>
                        </div>
                      )}
                    </div>
                    <Link href="/payments" passHref>
                        <Button className="w-full" variant="default" onClick={() => setSheetOpen(false)}>Donate Now</Button>
                    </Link>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
