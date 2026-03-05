'use client';

import Image from 'next/image';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import type { DevelopmentProject, SiteSettings } from '@/lib/types';
import { collection, query, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

function ProjectsList() {
    const firestore = useFirestore();

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'development_projects'));
    }, [firestore]);

    const { data: allProjects, isLoading: projectsLoading } = useCollection<DevelopmentProject>(projectsQuery);

    const projects = useMemo(() => 
        allProjects
            ?.filter(p => p.public === true)
            .sort((a,b) => a.status.localeCompare(b.status))
    , [allProjects]);


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
    };

    if (projectsLoading) {
        return (
            <div className="grid md:grid-cols-2 gap-8">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i} className="flex flex-col h-full bg-card/50 border-none">
                        <CardHeader className="p-4">
                            <Skeleton className="h-64 w-full mb-4" />
                            <Skeleton className="h-8 w-3/4" />
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4 p-4 pt-0">
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {(projects || []).map((project) => (
                <Link href={`/development/${project.id}`} key={project.id} className="block hover:shadow-xl transition-all duration-300 rounded-lg">
                    <Card className="flex flex-col h-full bg-card/50 border-none shadow-md">
                    <CardHeader className="p-4">
                        <div className="relative h-64 w-full mb-4 rounded-md overflow-hidden">
                        <Image
                            src={project.imageUrl}
                            alt={project.title}
                            data-ai-hint={project.imageHint}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                        </div>
                        <CardTitle className="flex justify-between items-center text-xl font-headline">
                        <span>{project.title}</span>
                        <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'} className={project.status === 'Completed' ? 'bg-green-600 text-white' : ''}>
                            {project.status}
                        </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4 p-4 pt-0">
                        <p className="text-muted-foreground text-sm line-clamp-3 whitespace-pre-wrap">{project.description}</p>
                        <div>
                        <Progress value={(project.currentAmount / project.goalAmount) * 100} className="w-full h-2" />
                        <div className="flex justify-between text-xs font-semibold text-muted-foreground mt-2">
                            <span>{formatCurrency(project.currentAmount)} raised</span>
                            <span>Goal: {formatCurrency(project.goalAmount)}</span>
                        </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                        <Button asChild className="w-full">
                        <Link href="/payments">Contribute to Our Mission</Link>
                        </Button>
                    </CardFooter>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

function DevelopmentContent() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    return (
        <div className="bg-transparent">
            <PageHeader
                title={settings?.projectsTitle || "Development Projects"}
                subtitle={settings?.projectsDescription || "Help us grow our parish and serve our community. See our current and completed projects."}
                titleColor={settings?.projectsTitleColor}
                subtitleColor={settings?.projectsDescriptionColor}
            />

            <section className="py-10 bg-transparent">
                <div className="container max-w-7xl mx-auto px-4">
                    <ProjectsList />
                </div>
            </section>
        </div>
    );
}

export default function DevelopmentPage() {
  return <DevelopmentContent />;
}
