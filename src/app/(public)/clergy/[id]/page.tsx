'use client';

import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Info, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Profile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClergyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const firestore = useFirestore();
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'profiles', id);
  }, [firestore, id]);

  const { data: profile, isLoading: profileLoading } = useDoc<Profile>(profileRef);

  if (profileLoading) {
    return (
        <div className="bg-transparent">
            <PageHeader title="..." subtitle="..." />
            <section className="py-16">
                <div className="container max-w-4xl mx-auto px-4">
                    <Skeleton className="h-[500px] w-full rounded-2xl" />
                </div>
            </section>
        </div>
    );
  }

  if (!profile) {
    return (
        <div className="bg-transparent min-h-[60vh] flex flex-col items-center justify-center p-4">
            <Info className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h1 className="text-2xl font-black uppercase tracking-tighter">Profile Not Found</h1>
            <p className="text-muted-foreground mt-2 text-center">The profile you are looking for may have been updated or archived.</p>
            <Button asChild variant="outline" className="mt-8 rounded-full">
                <Link href="/about">Back to Staff Directory</Link>
            </Button>
        </div>
    );
  }

  const sanitizedPhone = profile.phone ? profile.phone.replace(/\D/g, '') : '';

  return (
    <div className="bg-transparent animate-in fade-in duration-700">
      <PageHeader title={profile.name} subtitle={profile.title} />
      <section className="py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <Button asChild variant="ghost" className="mb-8 rounded-full hover:bg-primary/10 group">
            <Link href="/about">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Staff
            </Link>
          </Button>
          
          <Card className="overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
            <div className="grid md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="relative h-full min-h-[400px] bg-muted/10">
                  <Image
                    src={profile.imageUrl}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <CardHeader className="p-8 md:p-12 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Verified Clergy / Staff</span>
                  </div>
                  <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">{profile.name}</CardTitle>
                  <CardDescription className="text-xl text-primary font-bold mt-4">{profile.title}</CardDescription>
                </CardHeader>
                <CardContent className="p-8 md:p-12 pt-0 space-y-10">
                  <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 leading-relaxed italic border-l-4 border-primary/20 pl-8">
                    {profile.bio}
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-8 pt-8 border-t border-dashed">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Mail className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Official Email</p>
                            <a href={`mailto:${profile.email}`} className="font-bold text-lg hover:text-primary transition-colors truncate block">{profile.email}</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Phone className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Direct Contact</p>
                            {profile.phone ? (
                              <a href={`tel:${sanitizedPhone}`} className="font-bold text-lg hover:text-primary transition-colors hover:underline decoration-primary/30">
                                {profile.phone}
                              </a>
                            ) : (
                              <p className="font-bold text-lg text-muted-foreground">Not provided</p>
                            )}
                        </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
