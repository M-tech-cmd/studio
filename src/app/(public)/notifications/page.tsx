'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Announcement } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Info, Megaphone, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationHistoryPage() {
    const firestore = useFirestore();
    const announcementQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: announcements, isLoading } = useCollection<Announcement>(announcementQuery);

    return (
        <div className="bg-transparent pb-20">
            <PageHeader 
                title="Announcements Archive" 
                subtitle="Stay informed with the latest updates and alerts from the parish office." 
            />

            <section className="py-10">
                <div className="container max-w-4xl mx-auto px-4 space-y-6">
                    {isLoading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)
                    ) : announcements?.length === 0 ? (
                        <div className="text-center py-24 bg-muted/5 rounded-[3rem] border-2 border-dashed">
                            <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-10 mb-4" />
                            <h3 className="text-2xl font-black uppercase text-muted-foreground">Inbox Empty</h3>
                            <p className="text-muted-foreground font-medium mt-2">No past announcements found in the registry.</p>
                        </div>
                    ) : (
                        announcements?.map((a) => (
                            <Card key={a.id} className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all">
                                <CardHeader className="bg-primary/5 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Badge className={a.category === 'Alert' ? 'bg-red-500 text-white' : 'bg-primary text-white'}>
                                                {a.category === 'Alert' ? 'URGENT' : a.category.toUpperCase()}
                                            </Badge>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {a.createdAt ? format(a.createdAt.toDate(), 'MMMM dd, p') : 'Recently'}
                                            </span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter mt-3 leading-tight">{a.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 p-8">
                                    <p className="text-lg text-foreground/80 leading-relaxed font-medium">
                                        {a.message}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
