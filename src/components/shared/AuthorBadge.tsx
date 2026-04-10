'use client';

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { RegisteredUser, VerificationIcon } from "@/lib/types";
import { CheckCircle2, Shield, Gavel, Code, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";

interface AuthorBadgeProps {
    userId: string;
    fallbackName?: string;
    className?: string;
}

/**
 * Mapping of verification keys to their Lucide icon components.
 */
const IconMap: Record<VerificationIcon, React.ElementType> = {
    Shield: Shield,
    Gavel: Gavel,
    Code: Code,
    Star: Star,
    Award: Award,
    Check: CheckCircle2
};

/**
 * Role title mapping for administrative identities.
 */
const roleMapping: Record<string, string> = {
    admin: "Admin",
    chairman: "Chairman",
    treasurer: "Treasurer",
    secretary: "Secretary",
    tech_dev: "Tech/Dev",
};

/**
 * A reusable component that dynamically fetches user details (Masked Name, Selected Badge, Verification)
 * based on a Firestore UID. Ensures real-time consistency across the site.
 */
export function AuthorBadge({ userId, fallbackName, className }: AuthorBadgeProps) {
    const firestore = useFirestore();
    const userRef = useMemoFirebase(() => userId ? doc(firestore, 'users', userId) : null, [firestore, userId]);
    const { data: user, isLoading } = useDoc<RegisteredUser>(userRef);

    if (isLoading) return <Skeleton className="h-4 w-24 rounded" />;

    const isAdmin = user?.isAdmin === true;
    const isVerified = user?.isVerified === true;
    
    /**
     * Identity Logic: 
     * 1. If admin, resolve title: CustomTitle -> Role Map -> "Admin"
     * 2. Non-admins show personal name or fallback.
     */
    const roleTitle = user?.customTitle || (user?.role ? roleMapping[user.role] : null) || 'Admin';
    const displayName = (isAdmin) 
        ? `St. Martin De Porres ${roleTitle}`
        : (user?.name || fallbackName || 'Member');

    /**
     * Badge Resolution:
     * Uses the selected verificationIcon field from the registry.
     */
    const selectedIconKey = user?.verificationIcon || 'Check';
    const VerificationIconComp = IconMap[selectedIconKey] || CheckCircle2;

    return (
        <div className={cn("inline-flex items-center gap-1.5", className)}>
            <span className={cn(
                "text-xs font-bold transition-colors",
                isAdmin ? "text-primary" : "text-muted-foreground"
            )}>
                {displayName}
            </span>
            
            <div className="flex items-center gap-1">
                {isVerified && (
                    <VerificationIconComp className={cn(
                        "h-3.5 w-3.5",
                        isAdmin ? "text-primary" : "text-blue-500 fill-blue-500/10"
                    )} />
                )}
            </div>
        </div>
    );
}
