'use client';
import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Profile, SiteContent } from '@/lib/types';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

function AboutContent() {
    const firestore = useFirestore();

    const profilesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'profiles');
    }, [firestore]);

    const { data: allProfiles, isLoading: profilesLoading } = useCollection<Profile>(profilesQuery);

    const profiles = useMemo(() => 
        allProfiles
            ?.filter(p => p.active === true)
            .sort((a, b) => a.name.localeCompare(b.name))
    , [allProfiles]);

    const siteContentQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, "site_content");
    }, [firestore]);

    const { data: siteContent, isLoading: contentLoading } = useCollection<SiteContent>(
        siteContentQuery
      );
    
    const aboutContent = siteContent?.find(c => c.id === 'about-us');
    const devTeamContent = siteContent?.find(c => c.id === 'about-dev-team');

    const isLoading = profilesLoading || contentLoading;

    if(isLoading) {
        return (
            <>
                <section className="py-10">
                    <div className="container max-w-7xl mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            <div>
                            <h2 className="text-3xl font-headline font-bold mb-4">Our History</h2>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            </div>
                            <div className="rounded-lg overflow-hidden shadow-lg">
                                <Skeleton className="w-full h-[400px]" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-10 bg-transparent">
                    <div className="container max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl font-headline font-bold text-center mb-6">Our Clergy & Staff</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="text-center border-0 shadow-none bg-transparent h-full">
                                <CardContent className="flex flex-col items-center p-6">
                                    <Skeleton className="h-32 w-32 rounded-full mb-4" />
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    </div>
                </section>
            </>
        )
    }

    return (
        <>
            <section className="py-10">
                <div className="container max-w-7xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    <div>
                    <h2 className="text-3xl font-headline font-bold mb-4">Our History</h2>
                        <div
                            className="prose text-muted-foreground mb-4 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: aboutContent?.content || `<p>Founded in 1962, St. Martin De Porres Parish has grown from a small community of faithful into a vibrant and diverse parish family. Named after the patron saint of mixed-race people and social justice, our parish has always had a special commitment to unity, service, and love for all of God's children.</p>` }}
                        />
                    </div>
                    <div className="rounded-lg overflow-hidden shadow-lg">
                        <Image
                        src={aboutContent?.imageUrl || "https://picsum.photos/seed/interior/600/400"}
                        alt={aboutContent?.title || 'Church Interior'}
                        data-ai-hint={(aboutContent?.imageHint || "church interior") as string}
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                        unoptimized
                        />
                    </div>
                </div>
                </div>
            </section>

            <section className="py-10 bg-transparent">
                <div className="container max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-headline font-bold text-center mb-6">Our Clergy & Staff</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {(profiles || []).map((profile) => (
                    <Link href={`/about/${profile.id}`} key={profile.id} className="block hover:shadow-xl transition-all duration-300 rounded-lg hover:-translate-y-1">
                        <Card className="text-center border-0 shadow-none bg-transparent h-full">
                        <CardContent className="flex flex-col items-center p-6">
                            <div className="relative h-32 w-32 mb-4 border-4 border-background shadow-sm rounded-full">
                            <Image
                                src={profile.imageUrl}
                                alt={profile.name}
                                data-ai-hint={profile.imageHint}
                                fill
                                className="rounded-full object-cover"
                                unoptimized
                            />
                            </div>
                            <h3 className="text-lg font-semibold">{profile.name}</h3>
                            <p className="text-primary font-medium text-sm uppercase tracking-tight">{profile.title}</p>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>
                        </CardContent>
                        </Card>
                    </Link>
                    ))}
                </div>
                </div>
            </section>
            
            <section className="py-10">
                <div className="container max-w-7xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    <div className="rounded-lg overflow-hidden shadow-lg">
                        <Image
                        src={devTeamContent?.imageUrl || "https://picsum.photos/seed/dev-team/600/400"}
                        alt={devTeamContent?.title || 'Development Team'}
                        data-ai-hint={(devTeamContent?.imageHint || "development team") as string}
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                        unoptimized
                        />
                    </div>
                    <div>
                    <h2 className="text-3xl font-headline font-bold mb-4">Development Team</h2>
                    <h3 className="text-xl font-semibold text-primary mb-2">{devTeamContent?.title || 'St. Martin Youth Serving Christ (YSC)'}</h3>
                        <div
                            className="prose text-muted-foreground mb-4 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: devTeamContent?.content || '<p>This church management system was proudly developed by the talented members of the St. Martin Youth Serving Christ (YSC) group.</p>' }}
                        />
                    </div>
                </div>
                </div>
            </section>
        </>
    )
}

export default function AboutPage() {
  return (
    <div className="bg-transparent">
      <PageHeader
        title="About St. Martin De Porres"
        subtitle="Learn about our history, our team, and our mission."
      />
      <AboutContent />
    </div>
  );
}
