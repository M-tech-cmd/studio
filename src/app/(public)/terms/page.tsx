'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteContent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function TermsContent() {
    const firestore = useFirestore();
    const contentRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_content', 'terms-of-use');
    }, [firestore]);

    const { data: termsContent, isLoading: contentLoading } = useDoc<SiteContent>(contentRef);

    if (contentLoading) {
        return (
            <Card>
                <CardContent className="p-6 md:p-10 space-y-6">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />

                        <Skeleton className="h-8 w-1/2 pt-6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }
    
  return (
     <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-6 md:p-10 space-y-6 text-muted-foreground">
            <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: termsContent?.content || '<p>Terms of use content is currently being updated. Please check back soon.</p>' }} />
        </CardContent>
    </Card>
  )
}

export default function TermsPage() {
  return (
    <div className="bg-transparent pb-20">
      <PageHeader
        title={'Terms of Use'}
        subtitle="Please read our terms of use carefully before using the church hub."
      />

      <section className="py-10">
        <div className="container max-w-4xl mx-auto px-4">
           <TermsContent />
        </div>
      </section>
    </div>
  );
}