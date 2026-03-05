'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import type { CommunityGroup, SiteSettings } from '@/lib/types';
import { collection, query, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";


function GroupCard({ group }: { group: CommunityGroup }) {
    return (
        <Link href={`/community/${group.id}`} className="block h-full">
            <Card className="flex flex-col h-[420px] w-[300px] overflow-hidden transition-shadow duration-300 hover:shadow-xl bg-card/50 border-none shadow-md">
                <div className="relative w-full h-48 bg-muted/20 p-2">
                    <Image
                        src={group.imageUrl}
                        alt={group.name}
                        data-ai-hint={group.imageHint}
                        fill
                        className="object-contain"
                        unoptimized
                    />
                </div>
                <CardHeader className="p-4">
                    <CardTitle className="truncate font-headline">{group.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-4 pt-0">
                    <p className="text-muted-foreground text-sm line-clamp-4">
                        {group.description}
                    </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                     <Button variant="link" className="p-0">View Details <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </CardFooter>
            </Card>
        </Link>
    );
}

function GroupCarousel({ title, groups }: { title: string, groups: CommunityGroup[] }) {
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    if (!groups || groups.length === 0) {
        return <p className="text-center text-muted-foreground py-10">No groups found in this category.</p>
    };

    return (
        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">{title} ({groups.length})</h2>
            <Carousel
                plugins={[plugin.current]}
                className="w-full"
                opts={{
                    align: "start",
                    loop: groups.length > 4,
                }}
            >
                <CarouselContent className="-ml-4">
                    {groups.map(group => (
                        <CarouselItem key={group.id} className="pl-4 basis-auto">
                            <GroupCard group={group} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </div>
    );
}

const filterCategories = ['All', 'Small Christian Communities', 'Groups', 'Choirs', 'Ministries'];
const categoryTypeMap: { [key: string]: CommunityGroup['type'] | 'All' } = {
  'All': 'All',
  'Small Christian Communities': 'Small Christian Community',
  'Groups': 'Group',
  'Choirs': 'Choir',
  'Ministries': 'Ministry',
};


function CommunityContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const groupQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'community_groups'));
  }, [firestore]);

  const { data: allGroups, isLoading } = useCollection<CommunityGroup>(groupQuery);

  const filteredGroups = useMemo(() => {
    if (!allGroups) return [];
    return allGroups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allGroups, searchTerm]);

  const categorizedGroups = useMemo(() => {
    if (!allGroups) return {};
    return filterCategories.reduce((acc, category) => {
        if (category === 'All') {
            acc[category] = allGroups;
        } else {
            const type = categoryTypeMap[category];
            if (type !== 'All') {
                 acc[category] = allGroups.filter(g => g.type === type);
            }
        }
        return acc;
    }, {} as {[key: string]: CommunityGroup[]});
  }, [allGroups]);

  const displayedGroups = searchTerm ? filteredGroups : (categorizedGroups[activeCategory] || []);

  return (
    <div className="bg-transparent">
      <PageHeader
        title={settings?.communityTitle || "Parish Community"}
        subtitle={settings?.communityDescription || "Find fellowship and grow in faith with our vibrant community groups."}
        titleColor={settings?.communityTitleColor}
        subtitleColor={settings?.communityDescriptionColor}
      />

      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-7xl mx-auto px-4 py-3 space-y-3">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search all groups by name..."
              className="pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           {!searchTerm && (
             <div className="flex flex-wrap gap-2">
                {filterCategories.map(category => (
                    <Button
                        key={category}
                        variant={activeCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCategory(category)}
                        className="transition-all rounded-full h-8"
                    >
                        {category}
                    </Button>
                ))}
             </div>
           )}
        </div>
      </div>

      <section className="py-10 bg-transparent">
        <div className="container max-w-7xl mx-auto px-4">
          {isLoading ? (
             <div className="space-y-10">
                <Skeleton className="h-8 w-1/4 mb-4" />
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 3 }).map((_, j) => (
                        <Card key={j} className="w-[300px] flex-shrink-0 bg-card/50 border-none">
                            <Skeleton className="h-[420px] w-full" />
                        </Card>
                    ))}
                </div>
             </div>
          ) : searchTerm ? (
            <div>
              <h2 className="text-2xl font-bold font-headline mb-4">Search Results ({displayedGroups.length})</h2>
              {displayedGroups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedGroups.map(group => <GroupCard key={group.id} group={group} />)}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">No groups found matching your search.</p>
              )}
            </div>
          ) : (
            <GroupCarousel title={activeCategory} groups={displayedGroups} />
          )}
        </div>
      </section>
    </div>
  );
}

export default function CommunityPage() {
    return <CommunityContent />;
}
