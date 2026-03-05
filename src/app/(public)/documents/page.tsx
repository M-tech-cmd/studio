'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import type { Document, SiteSettings } from '@/lib/types';
import { collection, query, Timestamp, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

function DocumentsList() {
    const firestore = useFirestore();
    
    const documentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'documents'));
    }, [firestore]);

    const { data: allDocuments, isLoading: documentsLoading } = useCollection<Document>(documentsQuery);

    const documents = useMemo(() => 
        allDocuments
            ?.filter(d => d.public === true)
            .sort((a,b) => {
                const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date as any).getTime();
                const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date as any).getTime();
                return dateB - dateA;
            })
    , [allDocuments]);


    const getDateString = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString();
    }
    
    if (documentsLoading) {
        return (
             <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        )
    }

  return (
    <TableBody>
        {(documents || []).map((doc) => (
            <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                    <div className="font-semibold text-foreground">{doc.title}</div>
                    <div className="text-xs text-muted-foreground whitespace-pre-wrap">{doc.description}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{doc.category}</Badge></TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{getDateString(doc.date)}</TableCell>
                <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                        <Link href={doc.url} download>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                        </Link>
                    </Button>
                </TableCell>
            </TableRow>
        ))}
    </TableBody>
  );
}

function DocumentsContent() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    return (
        <div className="bg-transparent">
            <PageHeader
                title={settings?.documentsTitle || "Parish Documents"}
                subtitle={settings?.documentsDescription || "Stay informed with our latest bulletins, newsletters, and official documents."}
                titleColor={settings?.documentsTitleColor}
                subtitleColor={settings?.documentsDescriptionColor}
            />

            <section className="py-10">
                <div className="container max-w-7xl mx-auto px-4">
                    <Card className="bg-card/50 border-none shadow-md overflow-hidden">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                    <TableHead className="font-headline font-bold">Document Title</TableHead>
                                    <TableHead className="hidden md:table-cell font-headline font-bold">Category</TableHead>
                                    <TableHead className="hidden sm:table-cell font-headline font-bold">Date</TableHead>
                                    <TableHead className="text-right font-headline font-bold">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <DocumentsList />
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    )
}

export default function DocumentsPage() {
    return <DocumentsContent />;
}
