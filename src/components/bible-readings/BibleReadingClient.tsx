'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, BookOpen } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { BibleReading } from '@/lib/types';
import { collection, orderBy, query, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useMemo } from 'react';

export function BibleReadingClient() {
  const firestore = useFirestore();

  const readingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bible_readings'));
  }, [firestore]);
  
  const { data: allReadings, isLoading: readingsLoading } = useCollection<BibleReading>(readingsQuery);

  const readings = useMemo(() =>
    allReadings
        ?.filter(r => r.published)
        .sort((a,b) => {
            const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date as any).getTime();
            const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date as any).getTime();
            return dateB - dateA;
        })
  , [allReadings]);

    const getDateString = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
  if (readingsLoading) {
      return (
          <section className="py-10">
              <div className="container max-w-4xl mx-auto px-4">
                  <div className="space-y-8">
                      {Array.from({length: 2}).map((_, i) => (
                           <Card key={i} className="overflow-hidden bg-card/50 border-none shadow-md">
                               <CardHeader>
                                   <Skeleton className="h-8 w-3/4 mb-2" />
                                   <Skeleton className="h-4 w-1/4" />
                               </CardHeader>
                               <CardContent className="space-y-6">
                                   <Skeleton className="h-24 w-full" />
                               </CardContent>
                           </Card>
                      ))}
                  </div>
              </div>
          </section>
      )
  }

  return (
    <section className="py-10">
      <div className="container max-w-4xl mx-auto px-4">
        {readings && readings.length === 0 ? (
          <Card className="text-center py-12 bg-card/50 border-none shadow-md">
            <CardContent>
              <h3 className="text-xl font-semibold text-muted-foreground">
                No Bible Readings Available
              </h3>
              <p className="text-muted-foreground mt-2">
                Please check back later for daily readings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {(readings || []).map((reading) => (
              <Card key={reading.id} className="overflow-hidden bg-card/50 border-none shadow-md">
                <CardHeader className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold font-headline">
                        {reading.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{getDateString(reading.date)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6 pt-0">
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground">First Reading</h3>
                      <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-lg prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: reading.firstReading }} />
                      </blockquote>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 mt-4 text-foreground">Psalm</h3>
                       <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-lg prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: reading.psalm }} />
                      </blockquote>
                    </div>
                    {reading.secondReading && (
                      <div>
                          <h3 className="font-semibold text-lg mb-2 mt-4 text-foreground">Second Reading</h3>
                           <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-lg prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: reading.secondReading }} />
                          </blockquote>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg mb-2 mt-4 text-foreground">Gospel</h3>
                      <blockquote className="border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50/20 rounded-r-lg prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: reading.gospel }} />
                      </blockquote>
                    </div>
                  </div>

                  {reading.reflection && (
                    <div className="pt-6 border-t border-border">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-foreground">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Reflection
                      </h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground italic leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: reading.reflection }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
