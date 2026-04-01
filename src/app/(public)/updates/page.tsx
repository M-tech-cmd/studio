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

/**
 * Updates Feed: Restructured to 4-column grid mirroring the Events page.
 * Synchronized with Bulletin layout for a unified visual experience.
 */
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Filter Bar */}
      <div className="flex flex-wrap gap-2 pb-6 border-b border-dashed">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "rounded-full transition-all px-6 h-9 font-bold",
              selectedCategory === cat && "shadow-md scale-105"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {!filteredPosts || filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed max-w-2xl mx-auto">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/80">No Updates Found</h2>
          <p className="text-muted-foreground mt-3 font-medium">
            {selectedCategory === 'All' 
              ? 'Check back soon for the latest news and announcements.' 
              : `No posts found in the "${selectedCategory}" category.`}
          </p>
          {selectedCategory !== 'All' && (
            <Button variant="link" onClick={() => setSelectedCategory('All')} className="mt-4 font-bold">
              Clear Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="bg-transparent pb-20">
            <PageHeader
                title={settings?.bulletinTitle || "Church Updates"}
                subtitle={settings?.bulletinDescription || "Stay up-to-date with the latest parish news, announcements, and reflections."}
                titleColor={settings?.bulletinTitleColor}
                subtitleColor={settings?.bulletinDescriptionColor}
            />
            <section className="py-10 bg-transparent">
                <div className="container max-w-7xl mx-auto px-4">
                    <BulletinFeed />
                </div>
            </section>
        </div>
    );
}

export default function BulletinPage() {
  return <BulletinContent />;
}
