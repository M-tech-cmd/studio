'use client';

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { RegisteredUser } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthorDisplayProps {
    authorId: string;
    fallbackName?: string;
    className?: string;
}

const roleMapping: Record<string, string> = {
    admin: "St. Martin De Porres Admin",
    chairman: "St. Martin De Porres Chairman",
    tech_dev: "St. Martin De Porres Tech/Dev",
    treasurer: "St. Martin De Porres Treasurer",
    secretary: "St. Martin De Porres Secretary",
};

/**
 * AuthorDisplay: Fetches user role from Firestore and returns the official display name.
 */
export function AuthorDisplay({ authorId, fallbackName, className }: AuthorDisplayProps) {
    const firestore = useFirestore();
    const userRef = useMemoFirebase(() => authorId ? doc(firestore, 'users', authorId) : null, [firestore, authorId]);
    const { data: user, isLoading } = useDoc<RegisteredUser>(userRef);

    if (isLoading) return <Skeleton className="h-4 w-24 rounded" />;

    if (!user) return <span className={className}>{fallbackName || 'Parish Member'}</span>;

    const isAdmin = user.isAdmin === true || user.role !== 'user';
    
    // If admin, map role. Otherwise use personal name.
    const displayName = isAdmin 
        ? (roleMapping[user.role] || "St. Martin De Porres Admin")
        : (user.name || fallbackName || 'Member');

    return <span className={className}>{displayName}</span>;
}
