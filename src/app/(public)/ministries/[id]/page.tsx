
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, User, Clock, Mail, Info, ShieldCheck, Heart, Target } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { CommunityGroup } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function MinistryDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  
  const groupRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'community_groups', id);
  }, [firestore, id]);

  const { data: ministry, isLoading: groupLoading } = useDoc<CommunityGroup>(groupRef);

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

  if (!ministry || ministry.type !== 'Ministry') {
    return (
        <div className="bg-transparent min-h-[60vh] flex flex-col items-center justify-center p-4">
            <Info className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h1 className="text-2xl font-black uppercase">Ministry Not Found</h1>
            <p className="text-muted-foreground mt-2 text-center">This ministry may have been renamed or archived.</p>
            <Button asChild variant="outline" className="mt-8 rounded-full">
                <Link href="/ministries">View All Ministries</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="bg-transparent animate-in fade-in duration-700">
      <PageHeader title={ministry.name} subtitle="Official Parish Ministry" />
      <section className="py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <Button asChild variant="ghost" className="mb-8 rounded-full hover:bg-primary/10 group">
            <Link href="/ministries">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Ministries
            </Link>
          </Button>
          <Card className="overflow-hidden border-none shadow-2xl rounded-2xl bg-card">
            <div className="relative h-96 w-full">
                <Image
                  src={ministry.imageUrl}
                  alt={ministry.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-white text-xs font-black px-4 py-1.5 uppercase tracking-widest shadow-lg">
                        <ShieldCheck className="h-3 w-3 mr-2" />
                        Verified Ministry
                    </Badge>
                </div>
            </div>
            <CardContent className="p-8 md:p-12 space-y-8">
                <div>
                    <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter mb-6">{ministry.name}</CardTitle>
                    <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 leading-relaxed mb-8">
                        {ministry.description}
                    </div>

                    {ministry.goals && (
                        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/20 mb-8">
                            <h4 className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm mb-4">
                                <Target className="h-5 w-5" />
                                Ministry Goals & Mission
                            </h4>
                            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                {ministry.goals}
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
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ministry Lead</p>
                            <p className="font-bold text-lg">{ministry.leader}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Schedule</p>
                            <p className="font-bold text-lg">{ministry.schedule}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Heart className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Volunteer Count</p>
                            <p className="font-bold text-lg">{ministry.memberCount || 0} Active Servants</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contact Office</p>
                            <a href={`mailto:${ministry.contact}`} className="font-bold text-lg hover:text-primary transition-colors">{ministry.contact}</a>
                        </div>
                    </div>
              </div>
              
              <div className="bg-muted/30 p-8 rounded-2xl border border-dashed text-center">
                <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">Ready to Serve?</h4>
                <p className="text-muted-foreground mb-6">"As each has received a gift, use it to serve one another, as good stewards of God's varied grace." (1 Peter 4:10)</p>
                <Button asChild className="rounded-full px-8 h-12 font-bold shadow-lg">
                    <a href={`mailto:${ministry.contact}?subject=Joining ${ministry.name}`}>Get Involved Today</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
