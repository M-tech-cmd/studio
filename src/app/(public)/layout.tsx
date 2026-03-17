
'use client';

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PresenceManager } from "@/components/shared/PresenceManager";
import { WhatsAppChatWidget } from "@/components/shared/WhatsAppChatWidget";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { SiteSettings, RegisteredUser } from "@/lib/types";
import { AlertTriangle, Hammer, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function MaintenanceShield({ message }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-primary/10 p-6 rounded-full mb-8 animate-pulse">
                <Hammer className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground mb-4">SYSTEM MAINTENANCE</h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8">
                {message || "We are currently performing scheduled maintenance to improve our digital services. Please check back shortly."}
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-primary/60 uppercase tracking-widest border-t pt-8">
                <AlertTriangle className="h-4 w-4" />
                St. Martin De Porres Portal
            </div>
        </div>
    );
}

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<RegisteredUser>(userDocRef);

  const isSuperAdmin = user?.email === 'kimaniemma20@gmail.com' || user?.uid === 'BKSmmIdohYQHlao5V9eZ9JQyaEV2';
  const isAdmin = userProfile?.isAdmin === true || isSuperAdmin;

  // Maintenance Check: If maintenance mode is ON and user is NOT an admin, block the site.
  if (settings?.maintenanceMode && !isAdmin) {
      return <MaintenanceShield message={settings.maintenanceMessage} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {settings?.maintenanceMode && isAdmin && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between text-xs font-black tracking-widest sticky top-0 z-[100]">
              <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  MAINTENANCE MODE ACTIVE (ADMIN VIEW)
              </div>
              <Button asChild size="sm" variant="secondary" className="h-6 text-[10px]">
                  <Link href="/admin/dashboard">DEACTIVATE</Link>
              </Button>
          </div>
      )}
      <Header />
      <PresenceManager />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppChatWidget />
    </div>
  );
}
