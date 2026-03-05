'use client';
import { PageHeader } from '@/components/shared/PageHeader';
import { EventCard } from '@/components/shared/EventCard';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, orderBy, query, doc } from 'firebase/firestore';
import type { Event, SiteSettings } from '@/lib/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function EventsList() {
    const firestore = useFirestore();
    const eventsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'events'), orderBy('date', 'desc'));
    }, [firestore]);
    
    const { data: events, isLoading } = useCollection<Event>(eventsQuery);

    if (isLoading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-start">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="w-full bg-card/50 border-none">
                        <Skeleton className="aspect-square w-full" />
                        <CardHeader className="p-3">
                            <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {(events || []).map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    )
}

function EventsContent() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    return (
        <div className="bg-transparent">
            <PageHeader
                title={settings?.eventsTitle || "Parish Events"}
                subtitle={settings?.eventsDescription || "Join us for worship, fellowship, and service. There's something for everyone."}
                titleColor={settings?.eventsTitleColor}
                subtitleColor={settings?.eventsDescriptionColor}
            />

            <section className="py-10 bg-transparent">
                <div className="container max-w-7xl mx-auto px-4">
                    <EventsList />
                </div>
            </section>
        </div>
    );
}

export default function EventsPage() {
  return <EventsContent />;
}
