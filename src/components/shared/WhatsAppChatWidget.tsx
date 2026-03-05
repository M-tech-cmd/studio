
'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

export function WhatsAppChatWidget() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    if (!settings?.showWhatsAppChat || !settings.whatsAppNumber) {
        return null;
    }
    
    const whatsappUrl = `https://wa.me/${settings.whatsAppNumber.replace(/\D/g, '')}`;

    return (
        <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(
                "fixed bottom-6 right-6 z-50",
                "h-16 w-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg",
                "hover:bg-green-600 transition-transform hover:scale-110"
            )}
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle className="h-8 w-8" />
        </a>
    );
}
