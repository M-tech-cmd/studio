import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Tag, ArrowRight } from 'lucide-react';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {

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
            <div className="relative w-full h-32">
                <Image
                src={event.imageUrl}
                alt={event.title}
                data-ai-hint={event.imageHint}
                fill
                className="object-cover"
                unoptimized
                />
            </div>
            <CardHeader className="p-3">
                <CardTitle className="text-xl font-headline line-clamp-1">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex-grow space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{event.description}</p>
                <div className="space-y-1.5 pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{getDateString(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{event.endTime ? `${formatTime(event.time)} - ${formatTime(event.endTime)}` : formatTime(event.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        <Badge variant="secondary" className="bg-[#2b457a] text-white hover:bg-[#2b457a]/90">
                            {event.category}
                        </Badge>
                        {event.mass && <Badge variant="outline">{event.mass}</Badge>}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-3 mt-auto">
                <Button variant="link" className="p-0 text-sm">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    </Link>
  );
}