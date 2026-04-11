'use client';

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { RegisteredUser } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AuthorDisplayProps {
    authorId: string;
    fallbackName?: string;
    className?: string;
    showAvatar?: boolean;
    avatarSize?: string;
}

const roleMapping: Record<string, string> = {
    admin: "St. Martin De Porres Admin",
    chairman: "St. Martin De Porres Chairman",
    tech_dev: "St. Martin De Porres Tech/Dev",
    treasurer: "St. Martin De Porres Treasurer",
    secretary: "St. Martin De Porres Secretary",
};

/**
 * AuthorDisplay: Strictly enforces role-based naming and avatars for administrators.
 * Admins always show "S" (St. Martin) initial and role title.
 * This persists regardless of the viewer's auth state.
 */
export function AuthorDisplay({ 
    authorId, 
    fallbackName, 
    className, 
    showAvatar = false, 
    avatarSize = "h-6 w-6" 
}: AuthorDisplayProps) {
    const firestore = useFirestore();
    const userRef = useMemoFirebase(() => authorId ? doc(firestore, 'users', authorId) : null, [firestore, authorId]);
    const { data: user, isLoading } = useDoc<RegisteredUser>(userRef);

    if (isLoading) return <Skeleton className="h-4 w-24 rounded" />;

    // Use fetched data or fallback to generic admin if user record is missing
    const isAdmin = user ? (user.isAdmin === true || user.role !== 'user') : true;
    
    const displayName = isAdmin 
        ? (user?.role ? (roleMapping[user.role] || "St. Martin De Porres Admin") : "St. Martin De Porres Admin")
        : (user?.name || fallbackName || 'Parish Member');

    // Force "S" for all official roles (all start with "St. Martin...")
    const initial = displayName.charAt(0).toUpperCase();

    if (showAvatar) {
        return (
            <div className="flex items-center gap-2">
                <Avatar className={cn(avatarSize, "border-2 border-white shadow-sm shrink-0")}>
                    {/* Security Guard: Never show personal photos for admins */}
                    {!isAdmin && user?.photoURL && (
                        <AvatarImage src={user.photoURL} alt={displayName} />
                    )}
                    <AvatarFallback className={cn(
                        "font-bold text-[10px] transition-colors",
                        isAdmin ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    )}>
                        {initial}
                    </AvatarFallback>
                </Avatar>
                <span className={className}>{displayName}</span>
            </div>
        );
    }

    return <span className={className}>{displayName}</span>;
}
