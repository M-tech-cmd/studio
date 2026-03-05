
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Clock, MapPin, ArrowLeft, Info } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Event } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PhotoGallery } from '@/components/shared/PhotoGallery';

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  
  const eventRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'events', id);
  }, [firestore, id]);

  const { data: event, isLoading: eventLoading } = useDoc<Event>(eventRef);

  if (eventLoading) {
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

  if (!event) {
    return (
        <div className="bg-transparent min-h-[60vh] flex flex-col items-center justify-center p-4">
            <Info className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h1 className="text-2xl font-black">EVENT NOT FOUND</h1>
            <p className="text-muted-foreground mt-2 text-center">This event may have been rescheduled or removed.</p>
            <Button asChild variant="outline" className="mt-8 rounded-full">
                <Link href="/events">Return to Events</Link>
            </Button>
        </div>
    );
  }

  const getDateString = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="bg-transparent animate-in fade-in duration-700">
      <PageHeader title={event.title} subtitle={event.category + " Details"} />
      <section className="py-8">
        <div className="container max-w-4xl mx-auto px-4">
            <Button asChild variant="ghost" className="mb-8 rounded-full hover:bg-primary/10 group">
                <Link href="/events">
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Events
                </Link>
            </Button>
          <Card className="overflow-hidden border-none shadow-2xl rounded-2xl bg-card mb-12">
            <div className="relative h-96 w-full">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-white uppercase font-black text-[10px] tracking-widest px-4 py-1.5 shadow-lg">
                        {event.category}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-8 md:p-12 space-y-8">
                <div>
                    <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter mb-6">{event.title}</CardTitle>
                    <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
                        {event.description}
                    </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6 bg-muted/20 p-8 rounded-2xl border border-dashed">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Date</p>
                            <p className="font-bold text-lg">{getDateString(event.date)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Time</p>
                            <p className="font-bold text-lg">
                                {event.endTime ? `${formatTime(event.time)} - ${formatTime(event.endTime)}` : formatTime(event.time)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 sm:col-span-2 border-t border-dashed pt-6">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Location</p>
                            <p className="font-bold text-lg">{event.location}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* Dynamic Photo Gallery */}
          <div className="pb-20">
            <PhotoGallery photos={event.galleryImages} title={event.title} />
          </div>
        </div>
      </section>
    </div>
  );
}
