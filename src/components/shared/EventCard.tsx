import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Tag, ArrowRight, Play, Mic } from 'lucide-react';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)/i.test(url);
  const isAudio = (url: string) => /\.(mp3|wav|flac)/i.test(url);

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
    <Link href={`/events/${event.id}`} className="block h-full">
        <Card className="flex flex-col w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 bg-white border-none">
            <div className="relative w-full h-40 bg-muted/20">
                {isVideo(event.imageUrl) ? (
                    <div className="h-full w-full flex items-center justify-center bg-slate-900">
                        <Play className="h-10 w-10 text-white opacity-40" />
                        <span className="absolute bottom-2 right-2 text-[8px] font-bold text-white uppercase bg-black/40 px-1.5 py-0.5 rounded">Video</span>
                    </div>
                ) : isAudio(event.imageUrl) ? (
                    <div className="h-full w-full flex items-center justify-center bg-slate-100">
                        <Mic className="h-10 w-10 text-primary opacity-40" />
                        <span className="absolute bottom-2 right-2 text-[8px] font-bold text-slate-500 uppercase bg-black/5 px-1.5 py-0.5 rounded">Audio</span>
                    </div>
                ) : (
                    <Image
                        src={event.imageUrl}
                        alt={event.title}
                        data-ai-hint={event.imageHint}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                )}
            </div>
            <CardHeader className="p-4">
                <CardTitle className="text-lg font-headline font-bold line-clamp-1 text-[#1e3a5f]">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">{event.description}</p>
                <div className="space-y-2 pt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{getDateString(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{event.endTime ? `${formatTime(event.time)} - ${formatTime(event.endTime)}` : formatTime(event.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        <Badge variant="secondary" className="bg-[#2b457a] text-white hover:bg-[#2b457a]/90 text-[8px] h-5">
                            {event.category}
                        </Badge>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 mt-auto border-t bg-muted/5">
                <Button variant="link" className="p-0 text-xs font-black uppercase tracking-tighter text-primary">
                    View Details
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
            </CardFooter>
        </Card>
    </Link>
  );
}
