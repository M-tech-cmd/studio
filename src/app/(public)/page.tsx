'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
    ArrowRight, 
    Calendar, 
    Clock, 
    ChevronRight, 
    Users, 
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, where } from 'firebase/firestore';
import type { Event, BulletinPost, Profile, CommunityGroup, DevelopmentProject, SiteSettings, Mass } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { formatDistanceToNow } from 'date-fns';
import { resolveMediaUrl } from '@/lib/upload-utils';

function HeroSection() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);

    return (
        <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden isolate">
            {isLoading ? (
                <Skeleton className="absolute inset-0 z-0" />
            ) : (
                <>
                    <Image 
                        src={resolveMediaUrl(settings?.heroImageUrl) || 'https://picsum.photos/seed/church-hero/1920/1080'} 
                        alt="Church Hero" 
                        fill 
                        priority
                        className="object-cover z-0"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-black/50 z-10" />
                </>
            )}
            
            <div className="container relative z-20 max-w-5xl mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {settings?.heroTitle || 'St. Martin De Porres Catholic Church'}
                </h1>
                <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-medium mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    {settings?.parishDescription || 'A vibrant community of faith, hope, and love serving the heart of Nakuru.'}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <Button asChild size="lg" className="h-14 px-10 rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-all">
                        <Link href="/about">Discover Our History</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-14 px-10 rounded-full font-bold text-lg border-2 text-white border-white hover:bg-white/10 backdrop-blur-sm transition-all">
                        <Link href="/events">Upcoming Events</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

function MassScheduleSection({ settings, isLoading }: { settings?: SiteSettings, isLoading: boolean }) {
    const firestore = useFirestore();
    const massesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'masses')) : null, [firestore]);
    const { data: masses, isLoading: massesLoading } = useCollection<Mass>(massesQuery);

    const orderedDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sortedMasses = masses ? [...masses].sort((a, b) => {
        const dayDiff = orderedDays.indexOf(a.day) - orderedDays.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
    }) : [];

    const formatTime = (time: string) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(h), parseInt(m));
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <section className="py-20 bg-transparent">
            <div className="container max-w-7xl mx-auto px-4">
                <SectionHeader 
                    title={settings?.massTitle || 'Mass Schedule'} 
                    description={settings?.massDescription || 'Join us for worship and spiritual nourishment throughout the week.'}
                    titleColor={settings?.massTitleColor}
                    descColor={settings?.massDescriptionColor}
                    boxColor={settings?.massBoxColor}
                    imageUrl={resolveMediaUrl(settings?.massImageUrl)}
                    isLoading={isLoading} 
                    settings={settings}
                />
                {massesLoading ? (
                    <div className="grid md:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full bg-card/50" />)}</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sortedMasses.map((mass) => (
                            <Card key={mass.id} className="bg-card border-none shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-primary/5 py-4">
                                    <CardTitle className="text-lg font-bold text-primary uppercase tracking-widest">{mass.day}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="font-black text-xl text-[#1e3a5f]">{mass.title}</p>
                                    <div className="flex items-center gap-2 mt-2 text-muted-foreground font-bold">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span>{formatTime(mass.startTime)} - {formatTime(mass.endTime)}</span>
                                    </div>
                                    {mass.description && <p className="text-xs mt-4 text-muted-foreground italic leading-relaxed">{mass.description}</p>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function UpcomingEvents({ settings, isLoading }: { settings?: SiteSettings, isLoading: boolean }) {
    const firestore = useFirestore();
    const eventsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'events'), orderBy('date', 'desc'), limit(4)) : null, [firestore]);
    const { data: events, isLoading: eventsLoading } = useCollection<Event>(eventsQuery);

    const getDateString = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <section className="py-20 bg-transparent">
            <div className="container max-w-7xl mx-auto px-4">
                <SectionHeader 
                    title={settings?.eventsTitle || 'Upcoming Events'} 
                    description={settings?.eventsDescription || 'Stay active in our community with these spiritual and social gatherings.'}
                    titleColor={settings?.eventsTitleColor}
                    descColor={settings?.eventsDescriptionColor}
                    boxColor={settings?.eventsBoxColor}
                    imageUrl={resolveMediaUrl(settings?.eventsImageUrl)}
                    isLoading={isLoading} 
                    settings={settings}
                />
                {eventsLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full bg-card/50" />)}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {events?.map((event) => (
                            <Link key={event.id} href={`/events/${event.id}`}>
                                <Card className="h-full bg-card border-none shadow-md rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <div className="relative h-48 w-full">
                                        <Image src={resolveMediaUrl(event.imageUrl)} alt={event.title} fill className="object-cover" unoptimized />
                                        <Badge className="absolute top-3 right-3 bg-primary text-white uppercase font-black text-[9px] tracking-widest">{event.category}</Badge>
                                    </div>
                                    <CardHeader className="p-5 pb-2">
                                        <CardTitle className="text-lg font-bold text-[#1e3a5f] line-clamp-1">{event.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0 space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5 text-primary" />
                                            <span>{getDateString(event.date)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{event.description}</p>
                                    </CardContent>
                                    <CardFooter className="p-5 pt-0">
                                        <Button variant="link" className="p-0 h-auto font-black text-xs uppercase tracking-widest text-primary">Details <ChevronRight className="ml-1 h-3 w-3" /></Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function ParishCommunities({ settings, isLoading }: { settings?: SiteSettings, isLoading: boolean }) {
    const firestore = useFirestore();
    const groupsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'community_groups'), where('type', '==', 'Small Christian Community'), limit(3)) : null, [firestore]);
    const { data: groups, isLoading: groupsLoading } = useCollection<CommunityGroup>(groupsQuery);

    return (
        <section className="py-20 bg-transparent">
            <div className="container max-w-7xl mx-auto px-4">
                <SectionHeader 
                    title={settings?.communityTitle || 'Parish Communities'} 
                    description={settings?.communityDescription || 'Find fellowship and grow in faith with our Small Christian Communities (Jumuia).'}
                    titleColor={settings?.communityTitleColor}
                    descColor={settings?.communityDescriptionColor}
                    boxColor={settings?.communityBoxColor}
                    imageUrl={resolveMediaUrl(settings?.communityImageUrl)}
                    isLoading={isLoading} 
                    settings={settings}
                />
                {groupsLoading ? (
                    <div className="grid md:grid-cols-3 gap-8">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full bg-card/50" />)}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {groups?.map((group) => (
                            <Link key={group.id} href={`/community/${group.id}`}>
                                <Card className="h-full bg-card border-none shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition-all text-center">
                                    <div className="relative h-40 w-full bg-muted/10 p-6 flex items-center justify-center">
                                        <Image src={resolveMediaUrl(group.imageUrl)} alt={group.name} fill className="object-contain p-4" unoptimized />
                                    </div>
                                    <CardHeader className="p-6 pb-2">
                                        <CardTitle className="text-xl font-bold text-[#1e3a5f]">{group.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{group.description}</p>
                                        <div className="flex items-center justify-center gap-4 mt-6 text-xs font-black uppercase text-primary tracking-widest">
                                            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {group.memberCount || 0} Members</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function MeetOurClergy({ settings, isLoading }: { settings?: SiteSettings, isLoading: boolean }) {
    const firestore = useFirestore();
    const clergyQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'profiles'), where('active', '==', true), limit(4)) : null, [firestore]);
    const { data: clergy, isLoading: clergyLoading } = useCollection<Profile>(clergyQuery);

    return (
        <section className="py-20 bg-transparent">
            <div className="container max-w-7xl mx-auto px-4">
                <SectionHeader 
                    title={settings?.clergyTitle || 'Meet Our Clergy & Staff'} 
                    description={settings?.clergyDescription || 'The dedicated team serving our vibrant parish family.'}
                    titleColor={settings?.clergyTitleColor}
                    descColor={settings?.clergyDescriptionColor}
                    boxColor={settings?.clergyBoxColor}
                    imageUrl={resolveMediaUrl(settings?.clergyImageUrl)}
                    isLoading={isLoading} 
                    settings={settings}
                />
                {clergyLoading ? (
                    <div className="grid md:grid-cols-4 gap-8">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full bg-card/50" />)}</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {clergy?.map((person) => (
                            <Link key={person.id} href={`/clergy/${person.id}`}>
                                <div className="group text-center space-y-4 cursor-pointer">
                                    <div className="relative aspect-square w-full rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                                        <Image src={resolveMediaUrl(person.imageUrl)} alt={person.name} fill className="object-cover" unoptimized />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-[#1e3a5f] group-hover:text-primary transition-colors">{person.name}</h3>
                                        <p className="text-xs font-black uppercase text-primary tracking-[0.2em] mt-1">{person.title}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function LatestBulletins({ settings, isLoading }: { settings?: SiteSettings, isLoading: boolean }) {
    const firestore = useFirestore();
    const bulletinsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'bulletins'), orderBy('createdAt', 'desc'), limit(3)) : null, [firestore]);
    const { data: bulletins, isLoading: bulletinsLoading } = useCollection<BulletinPost>(bulletinsQuery);

    return (
        <section className="py-20 bg-transparent">
            <div className="container max-w-7xl mx-auto px-4">
                <SectionHeader 
                    title={settings?.bulletinTitle || 'Latest Updates'} 
                    description={settings?.bulletinDescription || 'Stay informed with the latest parish news, announcements, and reflections.'}
                    titleColor={settings?.bulletinTitleColor}
                    descColor={settings?.bulletinDescriptionColor}
                    boxColor={settings?.bulletinBoxColor}
                    imageUrl={resolveMediaUrl(settings?.bulletinImageUrl)}
                    isLoading={isLoading} 
                    settings={settings}
                />
                {bulletinsLoading ? (
                    <div className="grid md:grid-cols-3 gap-8">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full bg-card/50" />)}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {bulletins?.map((post) => (
                            <Card key={post.id} className="flex flex-col h-full bg-card shadow-md transition-all hover:shadow-xl rounded-2xl border-none">
                                <CardHeader className="p-6 pb-2">
                                    <Badge variant="secondary" className="w-fit mb-4 uppercase text-[10px] font-black tracking-widest">{post.category}</Badge>
                                    <CardTitle className="text-xl font-bold line-clamp-2 min-h-[3.5rem] leading-tight text-[#1e3a5f]">{post.title}</CardTitle>
                                    <CardDescription className="text-xs mt-4 font-medium italic opacity-70">
                                        by {post.authorName} • {post.createdAt && typeof post.createdAt.toDate === 'function' ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'recent'}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="mt-auto p-6 pt-0">
                                    <Button asChild variant="link" className="p-0 h-auto font-black uppercase text-xs tracking-widest text-primary">
                                        <Link href={`/bulletin/${post.id}`}>Read Full Update <ArrowRight className="ml-2 h-3 w-3" /></Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function ParishProjects({ settings, isLoading }: { settings?: SiteSettings, isLoading: boolean }) {
    const firestore = useFirestore();
    const projectsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'development_projects'), where('public', '==', true), where('status', '==', 'Ongoing'), limit(2)) : null, [firestore]);
    const { data: projects, isLoading: projectsLoading } = useCollection<DevelopmentProject>(projectsQuery);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);

    return (
        <section className="py-20 bg-transparent">
            <div className="container max-w-7xl mx-auto px-4">
                <SectionHeader 
                    title={settings?.projectsTitle || 'Parish Projects'} 
                    description={settings?.projectsDescription || 'Supporting our mission and growth through critical infrastructure and community projects.'}
                    titleColor={settings?.projectsTitleColor}
                    descColor={settings?.projectsDescriptionColor}
                    boxColor={settings?.projectsBoxColor}
                    imageUrl={resolveMediaUrl(settings?.projectsImageUrl)}
                    isLoading={isLoading} 
                    settings={settings}
                />
                {projectsLoading ? (
                    <div className="grid md:grid-cols-2 gap-8">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 w-full bg-card/50" />)}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {projects?.map(project => (
                            <Link key={project.id} href={`/development/${project.id}`}>
                                <Card className="h-full hover:shadow-xl transition-all bg-card overflow-hidden hover:-translate-y-1 rounded-2xl border-none shadow-md">
                                    <CardHeader className="p-6 pb-2">
                                        <CardTitle className="text-xl font-black text-[#1e3a5f]">{project.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6 p-6 pt-0">
                                        <p className="text-sm text-muted-foreground line-clamp-2 h-10 font-medium">{project.description}</p>
                                        <div className="space-y-3">
                                            <Progress value={(project.currentAmount / project.goalAmount) * 100} className="w-full h-2.5" />
                                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                <span className="text-primary">{formatCurrency(project.currentAmount)} raised</span>
                                                <span>Goal: {formatCurrency(project.goalAmount)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function HomePage() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading = true } = useDoc<SiteSettings>(settingsRef);

    return (
        <div className="flex flex-col bg-transparent">
            <HeroSection />
            <MassScheduleSection settings={settings || undefined} isLoading={isLoading} />
            <UpcomingEvents settings={settings || undefined} isLoading={isLoading} />
            <ParishCommunities settings={settings || undefined} isLoading={isLoading} />
            <MeetOurClergy settings={settings || undefined} isLoading={isLoading} />
            <LatestBulletins settings={settings || undefined} isLoading={isLoading} />
            <ParishProjects settings={settings || undefined} isLoading={isLoading} />
            
            <section className="py-24 bg-white relative isolate overflow-hidden">
                <div className="container max-w-4xl mx-auto px-4 text-center">
                    <div className="bg-primary/5 p-12 rounded-[3rem] border-2 border-primary/10 shadow-2xl">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[#1e3a5f]">
                            {settings?.parishCtaTitle || 'Join Our Parish Family'}
                        </h2>
                        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium italic">
                            {settings?.parishCtaDescription || "Whether you're a lifelong Catholic or exploring faith for the first time, you have a spiritual home here at St. Martin De Porres."}
                        </p>
                        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
                            <Button asChild size="lg" className="rounded-full px-12 h-16 text-lg font-black shadow-2xl hover:scale-105 transition-all">
                                <Link href="/signup">{settings?.parishCtaButton1 || 'Become a Member'}</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="rounded-full px-12 h-16 text-lg font-black border-2 hover:bg-muted transition-all">
                                <Link href="/payments">{settings?.parishCtaButton2 || 'Support Our Mission'}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
