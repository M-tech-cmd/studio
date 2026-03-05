'use client';

import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Profile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const firestore = useFirestore();
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'profiles', id);
  }, [firestore, id]);

  const { data: profile, isLoading: profileLoading } = useDoc<Profile>(profileRef);


  if (profileLoading) {
    return (
        <div>
            <PageHeader title="..." subtitle="..." />
            <section className="py-10">
                <div className="container max-w-4xl mx-auto px-4">
                    <Skeleton className="h-10 w-48 mb-6" />
                     <Card className="overflow-hidden">
                        <div className="grid md:grid-cols-3">
                            <div className="md:col-span-1">
                                <Skeleton className="h-full min-h-[300px]" />
                            </div>
                            <div className="md:col-span-2 p-6 space-y-4">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
  }

  if (!profile) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={profile.name} subtitle={profile.title} />
      <section className="py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <Button asChild variant="outline" className="mb-6">
            <Link href="/about">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to About Us
            </Link>
          </Button>
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="relative h-full min-h-[300px]">
                  <Image
                    src={profile.imageUrl}
                    alt={profile.name}
                    data-ai-hint={profile.imageHint}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <CardHeader className="p-6">
                  <CardTitle className="text-3xl font-headline">{profile.name}</CardTitle>
                  <CardDescription className="text-xl text-primary">{profile.title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6 pt-0">
                  <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${profile.email}`} className="hover:underline">{profile.email}</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
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