
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, orderBy, query, doc } from 'firebase/firestore';
import type { BulletinPost, SiteSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BulletinPostCard } from '@/components/bulletin/BulletinPostCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function BulletinFeed() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const firestore = useFirestore();
  
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bulletins'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<BulletinPost>(postsQuery);

  const categories = useMemo(() => {
    if (!posts) return ['All'];
    const uniqueCats = Array.from(new Set(posts.map(p => p.category))).sort();
    return ['All', ...uniqueCats];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (selectedCategory === 'All') return posts;
    return posts.filter(p => p.category === selectedCategory);
  }, [posts, selectedCategory]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Filter Bar */}
      <div className="flex flex-wrap gap-2 pb-4 border-b">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "rounded-full transition-all",
              selectedCategory === cat && "shadow-md scale-105"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {!filteredPosts || filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed">
          <h2 className="text-2xl font-semibold text-muted-foreground">No Posts Found</h2>
          <p className="text-muted-foreground mt-2">
            {selectedCategory === 'All' 
              ? 'Check back soon for the latest news and announcements.' 
              : `No posts found in the "${selectedCategory}" category.`}
          </p>
          {selectedCategory !== 'All' && (
            <Button variant="link" onClick={() => setSelectedCategory('All')} className="mt-4">
              Clear Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <BulletinPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function BulletinContent() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    return (
        <div className="bg-transparent">
            <PageHeader
                title={settings?.bulletinTitle || "Church Bulletin"}
                subtitle={settings?.bulletinDescription || "Stay up-to-date with the latest parish news, announcements, and reflections."}
                titleColor={settings?.bulletinTitleColor}
                subtitleColor={settings?.bulletinDescriptionColor}
            />
            <section className="py-10 bg-transparent">
                <div className="container max-w-4xl mx-auto px-4">
                    <BulletinFeed />
                </div>
            </section>
        </div>
    );
}

export default function BulletinPage() {
  return <BulletinContent />;
}
