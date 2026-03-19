'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Profiles Page: Optimized for Chunk Loading.
 * Uses dynamic import with ssr: false to prevent the "Network Starvation" ChunkLoadError.
 * This ensures the main admin layout loads first before the heavy staff registry component.
 */
const ProfilesClient = dynamic(
  () => import('@/components/admin/ProfilesClient').then((mod) => mod.ProfilesClient),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }
);

export default function AdminProfilesPage() {
  return <ProfilesClient />;
}
