
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Target, TrendingUp, Info, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { DevelopmentProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PhotoGallery } from '@/components/shared/PhotoGallery';

export default function DevelopmentProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  
  const projectRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'development_projects', id);
  }, [firestore, id]);

  const { data: project, isLoading: projectLoading } = useDoc<DevelopmentProject>(projectRef);

  if (projectLoading) {
    return (
        <div className="bg-transparent">
            <PageHeader title="..." subtitle="..." />
            <section className="py-16">
                <div className="container max-w-4xl mx-auto px-4">
                    <Skeleton className="h-[600px] w-full rounded-2xl" />
                </div>
            </section>
        </div>
    );
  }

  if (!project) {
    return (
        <div className="bg-transparent min-h-[60vh] flex flex-col items-center justify-center p-4">
            <Info className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h1 className="text-2xl font-black uppercase">Project Not Found</h1>
            <p className="text-muted-foreground mt-2 text-center">The development project you are looking for may have concluded or been removed.</p>
            <Button asChild variant="outline" className="mt-8 rounded-full">
                <Link href="/development">View Current Projects</Link>
            </Button>
        </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  const progressPercentage = Math.min(Math.round((project.currentAmount / project.goalAmount) * 100), 100);

  return (
    <div className="bg-transparent animate-in fade-in duration-700">
      <PageHeader title={project.title} subtitle="Mission & Infrastructure Project" />
      <section className="py-8">
        <div className="container max-w-4xl mx-auto px-4">
            <Button asChild variant="ghost" className="mb-8 rounded-full hover:bg-primary/10 group">
                <Link href="/development">
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Projects
                </Link>
            </Button>
          <Card className="overflow-hidden border-none shadow-2xl rounded-2xl bg-card mb-12">
            <div className="relative h-[450px] w-full">
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 right-4">
                    <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'} className={project.status === 'Completed' ? 'bg-green-600 text-white font-black px-4 py-1.5 uppercase' : 'bg-primary text-white font-black px-4 py-1.5 uppercase'}>
                      {project.status}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-8 md:p-12 space-y-10">
                <div>
                    <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter mb-6">{project.title}</CardTitle>
                    <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {project.description}
                    </p>
                </div>

                <div className="space-y-8 bg-muted/20 p-8 md:p-12 rounded-3xl border border-dashed">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Fundraising Goal</span>
                        </div>
                        <span className="text-2xl font-black text-primary">{progressPercentage}%</span>
                    </div>
                    
                    <Progress value={progressPercentage} className="w-full h-5 rounded-full" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Raised Contribution</p>
                            <p className="text-3xl font-black text-primary">{formatCurrency(project.currentAmount)}</p>
                        </div>
                        <div className="space-y-1 md:text-right">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Goal</p>
                            <p className="text-3xl font-black">{formatCurrency(project.goalAmount)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
            {project.status !== 'Completed' && (
                <CardFooter className="p-8 md:p-12 bg-muted/10 border-t flex flex-col items-center">
                    <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">Help us make this project a reality</p>
                    <Button asChild size="lg" className="w-full max-w-md h-16 text-lg font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
                        <Link href="/payments">
                            <DollarSign className="mr-2 h-6 w-6" />
                            CONTRIBUTE TO THIS MISSION
                        </Link>
                    </Button>
                </CardFooter>
            )}
          </Card>

          <div className="pb-20">
            <PhotoGallery photos={project.galleryImages} title={project.title} />
          </div>
        </div>
      </section>
    </div>
  );
}
