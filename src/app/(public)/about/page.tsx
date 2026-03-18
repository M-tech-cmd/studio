'use client';
import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import type { Profile, SiteContent, SiteSettings } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Logo } from '@/components/shared/Logo';

function AboutContent() {
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

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
            <section className="py-16">
                <div className="container max-w-7xl mx-auto px-4">
                    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
                        <div className="space-y-6">
                            <Skeleton className="h-10 w-48 mb-4" />
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                        <Skeleton className="w-full h-[500px] rounded-2xl" />
                    </div>
                </div>
            </section>
        )
    }

    return (
        <>
            <section className="py-16 md:py-24">
                <div className="container max-w-7xl mx-auto px-4">
                    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight mb-8 border-l-4 border-primary pl-6">
                                Our History
                            </h2>
                            <div
                                className="prose prose-lg max-w-none text-muted-foreground leading-relaxed md:leading-loose text-base md:text-lg space-y-6"
                                dangerouslySetInnerHTML={{ __html: aboutContent?.content || `<p>Founded in 1962, St. Martin De Porres Parish has grown from a small community of faithful into a vibrant and diverse parish family.</p>` }}
                            />
                        </div>
                        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
                            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white aspect-[4/5] relative bg-muted">
                                {aboutContent?.imageUrl ? (
                                    <Image
                                        src={aboutContent.imageUrl}
                                        alt={aboutContent.title || 'Church History'}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Logo url={settings?.logoUrl} className="h-32 w-32 grayscale opacity-20" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-muted/10">
                <div className="container max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tighter mb-4">Our Clergy & Staff</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto font-medium">The dedicated team serving our parish family with faith and devotion.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {(profiles || []).map((profile) => (
                        <Link href={`/clergy/${profile.id}`} key={profile.id} className="group">
                            <Card className="text-center border-none shadow-none bg-transparent h-full transition-all duration-300 group-hover:-translate-y-2">
                            <CardContent className="flex flex-col items-center p-0">
                                <div className="relative h-48 w-48 mb-6 border-8 border-white shadow-xl rounded-full overflow-hidden transition-all group-hover:border-primary/20 bg-muted">
                                    <Image
                                        src={profile.imageUrl || "https://picsum.photos/seed/clergy/400/400"}
                                        alt={profile.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        unoptimized
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-[#1e3a5f] group-hover:text-primary transition-colors">{profile.name}</h3>
                                <p className="text-primary font-black text-[10px] uppercase tracking-widest mt-2">{profile.title}</p>
                            </CardContent>
                            </Card>
                        </Link>
                        ))}
                    </div>
                </div>
            </section>
            
            <section className="py-24">
                <div className="container max-w-7xl mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-video bg-muted group isolate">
                            {devTeamContent?.imageUrl ? (
                                <Image
                                    src={devTeamContent.imageUrl}
                                    alt={devTeamContent.title || 'Development Team'}
                                    fill
                                    className="object-contain transition-transform duration-1000 group-hover:scale-105"
                                    unoptimized
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Logo url={settings?.logoUrl} className="h-24 w-24 grayscale opacity-10" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 text-white">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Technical Partners</p>
                                <h4 className="text-2xl font-black tracking-tighter uppercase">{devTeamContent?.title || 'YSC GROUP'}</h4>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight mb-4">Development Credit</h2>
                            <h3 className="text-xl font-bold text-primary mb-2 uppercase tracking-wide">{devTeamContent?.title || 'St. Martin Youth Serving Christ (YSC)'}</h3>
                            <div
                                className="prose prose-lg text-muted-foreground leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: devTeamContent?.content || '<p>This digital infrastructure was proudly developed by the dedicated members of the St. Martin Youth Serving Christ (YSC) group.</p>' }}
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
        subtitle="Learn about our history, our dedicated leadership team, and the mission driving our community."
      />
      <AboutContent />
    </div>
  );
}