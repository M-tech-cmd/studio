
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, User, Clock, Mail, Users, Info, ShieldCheck, Target } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { CommunityGroup } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PhotoGallery } from '@/components/shared/PhotoGallery';

export default function CommunityGroupDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  
  const groupRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'community_groups', id);
  }, [firestore, id]);

  const { data: group, isLoading: groupLoading } = useDoc<CommunityGroup>(groupRef);

  if (groupLoading) {
    return (
        <div className="bg-transparent">
            <PageHeader title="..." subtitle="..." />
             <section className="py-16">
                <div className="container max-w-4xl mx-auto px-4">
                    <Skeleton className="h-[500px] w-full rounded-2xl" />
                </div>
            </section>
        </div>
    )
  }

  if (!group) {
    return (
        <div className="bg-transparent min-h-[60vh] flex flex-col items-center justify-center p-4">
            <Info className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h1 className="text-2xl font-black uppercase">Community Group Not Found</h1>
            <p className="text-muted-foreground mt-2 text-center">This group may have been renamed or reorganized.</p>
            <Button asChild variant="outline" className="mt-8 rounded-full">
                <Link href="/community">Back to Directory</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="bg-transparent animate-in fade-in duration-700">
      <PageHeader title={group.name} subtitle={group.type} />
      <section className="py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <Button asChild variant="ghost" className="mb-8 rounded-full hover:bg-primary/10 group">
            <Link href="/community">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Community
            </Link>
          </Button>
          <Card className="overflow-hidden border-none shadow-2xl rounded-2xl bg-card mb-12">
            <div className="relative h-96 w-full bg-muted/10">
                <Image
                  src={group.imageUrl}
                  alt={group.name}
                  fill
                  className="object-contain p-8"
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest shadow-lg">
                        {group.type === 'Ministry' ? <ShieldCheck className="h-3 w-3 mr-2" /> : null}
                        {group.type}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-8 md:p-12 space-y-8">
                <div>
                    <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter mb-6">{group.name}</CardTitle>
                    <p className="text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary/20 pl-6 mb-8">
                        {group.description}
                    </p>
                    
                    {group.goals && (
                        <div className="bg-muted/20 p-6 rounded-xl border border-dashed mb-8">
                            <h4 className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-4">
                                <Target className="h-4 w-4" />
                                Our Goals & Vision
                            </h4>
                            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {group.goals}
                            </p>
                        </div>
                    )}
                </div>
              
              <div className="grid sm:grid-cols-2 gap-6 border-t pt-8">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Leader</p>
                            <p className="font-bold text-lg">{group.leader}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Meeting Schedule</p>
                            <p className="font-bold text-lg">{group.schedule}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Members</p>
                            <p className="font-bold text-lg">{group.memberCount || 0} Parishioners</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contact</p>
                            <a href={`mailto:${group.contact}`} className="font-bold text-lg hover:text-primary transition-colors">{group.contact}</a>
                        </div>
                    </div>
              </div>
            </CardContent>
          </Card>

          <div className="pb-20">
            <PhotoGallery photos={group.galleryImages} title={group.name} />
          </div>
        </div>
      </section>
    </div>
  );
}
