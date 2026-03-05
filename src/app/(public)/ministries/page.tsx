'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import type { CommunityGroup, SiteSettings } from '@/lib/types';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function MinistriesList() {
    const firestore = useFirestore();

    const ministriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'community_groups'), where('type', '==', 'Ministry'));
    }, [firestore]);
    
    const { data: ministries, isLoading: ministriesLoading } = useCollection<CommunityGroup>(ministriesQuery);
    
    if (ministriesLoading) {
        return (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="flex flex-col h-full bg-card/50 border-none">
                        <CardHeader className="p-4">
                            <Skeleton className="h-48 w-full mb-4" />
                            <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 p-4 pt-0">
                             <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(ministries || []).map((ministry) => (
                <Link href={`/community/${ministry.id}`} key={ministry.id} className="block hover:shadow-xl transition-all duration-300 rounded-lg">
                    <Card className="flex flex-col h-full bg-card/50 border-none shadow-md">
                    <CardHeader className="p-4">
                        <div className="relative h-48 w-full mb-4 rounded-md overflow-hidden">
                        <Image
                            src={ministry.imageUrl}
                            alt={ministry.name}
                            data-ai-hint={ministry.imageHint}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                        </div>
                        <CardTitle className="text-xl font-headline">{ministry.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 pt-0">
                        <p className="text-muted-foreground text-sm line-clamp-3 whitespace-pre-wrap">{ministry.description}</p>
                    </CardContent>
                    <CardContent className="p-4 pt-0">
                        <Button variant="link" className="p-0 text-primary">View Details</Button>
                    </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

function MinistriesContent() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    return (
        <div className="bg-transparent">
            <PageHeader
                title={settings?.ministriesTitle || "Our Ministries"}
                subtitle={settings?.ministriesDescription || "Serving God and our community through action. Find a place to share your gifts."}
                titleColor={settings?.ministriesTitleColor}
                subtitleColor={settings?.ministriesDescriptionColor}
            />

            <section className="py-10 bg-transparent">
                <div className="container max-w-7xl mx-auto px-4">
                    <MinistriesList />
                </div>
            </section>
            
            <section className="py-10 bg-transparent">
                <div className="container max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-headline font-bold mb-4">Volunteer With Us</h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        "As each has received a gift, use it to serve one another, as good stewards of God's varied grace." (1 Peter 4:10). We invite you to prayerfully consider how you can share your time and talents with our parish family.
                    </p>
                    <Button asChild size="lg" className="rounded-full px-8 shadow-lg">
                        <a href={`mailto:${settings?.email || 'office@stmartin.test'}?subject=Volunteering Inquiry`}>
                            I'm Ready to Serve
                        </a>
                    </Button>
                </div>
            </section>
        </div>
    )
}

export default function MinistriesPage() {
  return <MinistriesContent />;
}
