'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const BulletinClient = dynamic(
  () => import('@/components/admin/BulletinClient').then((mod) => mod.BulletinClient),
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

export default function AdminBulletinPage() {
  return <BulletinClient />;
}
