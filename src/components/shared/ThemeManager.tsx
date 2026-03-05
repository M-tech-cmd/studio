
'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';
import { useEffect } from 'react';

export function ThemeManager() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    useEffect(() => {
        if (settings?.backgroundColor) {
            document.body.style.backgroundColor = settings.backgroundColor;
        } else {
            // Fallback or remove the style
            document.body.style.backgroundColor = ''; // Reverts to CSS
        }
        
        // Cleanup function to reset on unmount
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, [settings?.backgroundColor]);

    return null; // This component doesn't render anything
}
