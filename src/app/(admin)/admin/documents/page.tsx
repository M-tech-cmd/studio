'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Documents Page: Optimized for Chunk Loading.
 * Uses dynamic import with ssr: false to prevent Webpack Call/Chunk errors.
 * Ensures the main admin layout loads first before the heavy document registry.
 */
const DocumentsClient = dynamic(
  () => import('@/components/admin/DocumentsClient').then((mod) => mod.DocumentsClient),
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

export default function AdminDocumentsPage() {
  return <DocumentsClient />;
}
