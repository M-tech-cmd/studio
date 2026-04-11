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
 * AuthorDisplay: Strictly enforces role-based naming for administrators.
 * Never displays personal names for users with the isAdmin flag.
 */
export function AuthorDisplay({ authorId, fallbackName, className }: AuthorDisplayProps) {
    const firestore = useFirestore();
    const userRef = useMemoFirebase(() => authorId ? doc(firestore, 'users', authorId) : null, [firestore, authorId]);
    const { data: user, isLoading } = useDoc<RegisteredUser>(userRef);

    if (isLoading) return <Skeleton className="h-4 w-24 rounded" />;

    // If no user found, return fallback or generic admin
    if (!user) return <span className={className}>{fallbackName || 'St. Martin De Porres Admin'}</span>;

    const isAdmin = user.isAdmin === true || user.role !== 'user';
    
    // STRICT MASKING: If admin, ONLY show role title. Never personal name.
    if (isAdmin) {
        return <span className={className}>{roleMapping[user.role] || "St. Martin De Porres Admin"}</span>;
    }

    // Standard members show their provided name
    return <span className={className}>{user.name || fallbackName || 'Parish Member'}</span>;
}
