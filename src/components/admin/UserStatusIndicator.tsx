
'use client';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

interface UserStatusIndicatorProps {
    status?: 'Online' | 'Offline';
    lastSeen?: Timestamp;
}

export function UserStatusIndicator({ status, lastSeen }: UserStatusIndicatorProps) {
    const isOnline = status === 'Online';
    
    const lastSeenText = lastSeen
        ? formatDistanceToNow(lastSeen.toDate(), { addSuffix: true })
        : 'Never';

    const tooltipText = isOnline ? 'Currently online' : `Last seen: ${lastSeenText}`;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        )} />
                        <span className="text-sm text-muted-foreground hidden md:inline">
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
