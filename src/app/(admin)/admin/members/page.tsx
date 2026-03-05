
'use client';
import { MemberDirectory } from '@/components/admin/MemberDirectory';

export default function AdminMembersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Member Directory</h1>
                <p className="text-muted-foreground">
                    Search, filter, and view registered members of the parish.
                </p>
            </div>
            <MemberDirectory />
        </div>
    );
}
