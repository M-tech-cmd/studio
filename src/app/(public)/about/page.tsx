
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
                                dangerouslySetInnerHTML={{ __html: aboutContent?.content || `<p>Founded in 1962, St. Martin De Porres Parish has grown from a small community of faithful into a vibrant and diverse parish family. Named after the patron saint of mixed-race people and social justice, our parish has always had a special commitment to unity, service, and love for all of God's children.</p>` }}
                            />
                        </div>
                        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
                            <div className="rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02] border-2 border-white">
                                <Image
                                src={aboutContent?.imageUrl || "https://picsum.photos/seed/history/800/1000"}
                                alt={aboutContent?.title || 'Church History'}
                                data-ai-hint="church history"
                                width={800}
                                height={1000}
                                className="w-full h-auto object-cover"
                                unoptimized
                                />
                            </div>
                            <div className="mt-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-dashed text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Established 1962</p>
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
                                <div className="relative h-48 w-48 mb-6 border-8 border-white shadow-xl rounded-full overflow-hidden transition-all group-hover:border-primary/20">
                                <Image
                                    src={profile.imageUrl || "https://picsum.photos/seed/clergy/400/400"}
                                    alt={profile.name}
                                    data-ai-hint="clergy staff"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    unoptimized
                                />
                                </div>
                                <h3 className="text-xl font-bold text-[#1e3a5f] group-hover:text-primary transition-colors">{profile.name}</h3>
                                <p className="text-primary font-black text-[10px] uppercase tracking-widest mt-2">{profile.title}</p>
                                <p className="text-sm text-muted-foreground mt-4 line-clamp-2 italic px-4">"{profile.bio}"</p>
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
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                            <Image
                            src={devTeamContent?.imageUrl || "https://picsum.photos/seed/dev-team/800/600"}
                            alt={devTeamContent?.title || 'Development Team'}
                            data-ai-hint="development team"
                            width={800}
                            height={600}
                            className="w-full h-auto object-cover"
                            unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 text-white">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Technical Partners</p>
                                <h4 className="text-2xl font-black tracking-tighter">YSC GROUP</h4>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight mb-4">Development Team</h2>
                            <h3 className="text-xl font-bold text-primary mb-2 uppercase tracking-wide">{devTeamContent?.title || 'St. Martin Youth Serving Christ (YSC)'}</h3>
                            <div
                                className="prose prose-lg text-muted-foreground leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: devTeamContent?.content || '<p>This church management system was proudly developed by the talented members of the St. Martin Youth Serving Christ (YSC) group.</p>' }}
                            />
                            <div className="pt-6 border-t border-dashed">
                                <p className="text-sm font-medium italic">"Empowering the youth to build the digital future of the church."</p>
                            </div>
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
