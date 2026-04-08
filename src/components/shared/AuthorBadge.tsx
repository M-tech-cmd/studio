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

const IconMap: Record<VerificationIcon, React.ElementType> = {
    Shield: Shield,
    Gavel: Gavel,
    Code: Code,
    Star: Star,
    Award: Award,
    Check: CheckCircle2
};

const roleMapping: Record<string, string> = {
    admin: "St. Martin De Porres Admin",
    chairman: "St. Martin De Porres Chairman",
    treasurer: "St. Martin De Porres Treasurer",
    secretary: "St. Martin De Porres Secretary",
    tech_dev: "St. Martin De Porres Tech Developer",
};

/**
 * A reusable component that dynamically fetches user details (Masked Name, Badges, Verification)
 * based on a Firestore UID. Ensures real-time consistency across the site.
 */
export function AuthorBadge({ userId, fallbackName, className }: AuthorBadgeProps) {
    const firestore = useFirestore();
    const userRef = useMemoFirebase(() => userId ? doc(firestore, 'users', userId) : null, [firestore, userId]);
    const { data: user, isLoading } = useDoc<RegisteredUser>(userRef);

    if (isLoading) return <Skeleton className="h-4 w-24 rounded" />;

    const isAdmin = user?.isAdmin === true;
    const isVerified = user?.isVerified === true;
    
    // Identity Logic: Admin identities are strictly role-based to maintain professional branding.
    // Standard members display their personal name.
    const displayName = (isAdmin) 
        ? (roleMapping[user?.role || ''] || `St. Martin De Porres ${user?.customTitle || 'Admin'}`)
        : (user?.name || fallbackName || 'Member');

    const VerificationIconComp = user?.verificationIcon ? IconMap[user.verificationIcon] : CheckCircle2;

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
                        user?.verificationIcon ? "text-primary" : "text-blue-500 fill-blue-500/10"
                    )} />
                )}
                
                {user?.customTitle && !isAdmin && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-black tracking-tighter uppercase rounded-sm border-primary/20">
                        {user.customTitle}
                    </Badge>
                )}

                {isAdmin && (
                    <Shield className="h-2.5 w-2.5 text-primary opacity-50" />
                )}
            </div>
        </div>
    );
}
