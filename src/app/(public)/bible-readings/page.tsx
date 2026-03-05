'use client';
import { PageHeader } from '@/components/shared/PageHeader';
import { BibleReadingClient } from '@/components/bible-readings/BibleReadingClient';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';

function BibleReadingsContent() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    return (
        <div>
            <PageHeader
                title={settings?.bibleReadingsTitle || "Daily Bible Readings"}
                subtitle={settings?.bibleReadingsDescription || "Nourish your soul with the Word of God each day."}
                titleColor={settings?.bibleReadingsTitleColor}
                subtitleColor={settings?.bibleReadingsDescriptionColor}
            />
            <BibleReadingClient />
        </div>
    );
}

export default function BibleReadingsPage() {
  return <BibleReadingsContent />;
}
