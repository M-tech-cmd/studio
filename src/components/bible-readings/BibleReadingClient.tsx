'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { Calendar, BookOpen, Search, ArrowRight, Book } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { BibleReading } from '@/lib/types';
import { collection, query, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

function ReadingDetail({ reading }: { reading: BibleReading }) {
    const getDateString = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return (
        <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
            <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] mb-2">
                    <Book className="h-3 w-3" />
                    Holy Scripture
                </div>
                <DialogTitle className="text-3xl font-black tracking-tighter leading-none">{reading.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 font-bold text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {getDateString(reading.date)}
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1">
                <div className="p-8 space-y-10">
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">First Reading</h3>
                            <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed bg-muted/20 p-6 rounded-2xl border border-dashed"
                                dangerouslySetInnerHTML={{ __html: reading.firstReading }} 
                            />
                        </section>

                        <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Responsorial Psalm</h3>
                            <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed bg-primary/5 p-6 rounded-2xl border-l-4 border-primary"
                                dangerouslySetInnerHTML={{ __html: reading.psalm }} 
                            />
                        </section>

                        {reading.secondReading && (
                            <section>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Second Reading</h3>
                                <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed bg-muted/20 p-6 rounded-2xl border border-dashed"
                                    dangerouslySetInnerHTML={{ __html: reading.secondReading }} 
                                />
                            </section>
                        )}

                        <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1e3a5f] mb-4">Gospel</h3>
                            <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed bg-yellow-50/30 p-6 rounded-2xl border-l-4 border-yellow-400"
                                dangerouslySetInnerHTML={{ __html: reading.gospel }} 
                            />
                        </section>
                    </div>

                    {reading.reflection && (
                        <div className="pt-10 border-t border-dashed">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mb-4">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Spiritual Reflection
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground italic leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: reading.reflection }}
                            />
                        </div>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
    );
}

export function BibleReadingClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();

  const readingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bible_readings'));
  }, [firestore]);
  
  const { data: allReadings, isLoading: readingsLoading } = useCollection<BibleReading>(readingsQuery);

  const readings = useMemo(() => {
    if (!allReadings) return [];
    
    return allReadings
        .filter(r => r.published)
        .filter(r => {
            const search = searchTerm.toLowerCase();
            return (
                r.title.toLowerCase().includes(search) ||
                r.psalm.toLowerCase().includes(search) ||
                (r.secondReading?.toLowerCase().includes(search))
            );
        })
        .sort((a,b) => {
            const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date as any).getTime();
            const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date as any).getTime();
            return dateB - dateA;
        });
  }, [allReadings, searchTerm]);

    const getDateString = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
  if (readingsLoading) {
      return (
          <section className="py-10">
              <div className="container max-w-7xl mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({length: 6}).map((_, i) => (
                           <Card key={i} className="overflow-hidden bg-card/50 border-none shadow-md">
                               <CardHeader className="p-6">
                                   <Skeleton className="h-6 w-3/4 mb-2" />
                                   <Skeleton className="h-4 w-1/4" />
                               </CardHeader>
                               <CardFooter className="p-6 pt-0">
                                   <Skeleton className="h-10 w-full rounded-full" />
                               </CardFooter>
                           </Card>
                      ))}
                  </div>
              </div>
          </section>
      )
  }

  return (
    <section className="py-10 min-h-screen">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Search Header */}
        <div className="mb-12 max-w-2xl mx-auto">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search by title, psalm, or readings..." 
                    className="pl-12 h-14 text-lg rounded-full border-2 focus-visible:ring-primary shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {readings.length === 0 ? (
          <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed max-w-2xl mx-auto">
              <Book className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-20" />
              <h3 className="text-2xl font-black uppercase tracking-tight text-foreground/80">
                {searchTerm ? 'No readings found for this search' : 'No Bible Readings Available'}
              </h3>
              <p className="text-muted-foreground mt-3 max-w-xs mx-auto font-medium">
                {searchTerm ? 'Try adjusting your keywords or check back later for updates.' : 'Daily readings will be published here by the parish office.'}
              </p>
              {searchTerm && (
                  <Button variant="link" onClick={() => setSearchTerm('')} className="mt-4 font-bold">Clear Search</Button>
              )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {readings.map((reading) => (
              <Dialog key={reading.id}>
                <DialogTrigger asChild>
                    <Card className="group flex flex-col h-full bg-card border-none shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] cursor-pointer overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[9px] mb-4 opacity-60">
                                <Book className="h-3 w-3" />
                                Daily Word
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tighter leading-tight group-hover:text-primary transition-colors min-h-[4rem]">
                                {reading.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 flex-grow">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold bg-muted/30 w-fit px-4 py-1 rounded-full">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                <span>{getDateString(reading.date)}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="p-8 pt-0">
                            <Button className="w-full h-12 rounded-full font-black text-xs uppercase tracking-widest shadow-lg group-hover:scale-[1.02] transition-transform">
                                Read Full Text
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </DialogTrigger>
                <ReadingDetail reading={reading} />
              </Dialog>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
