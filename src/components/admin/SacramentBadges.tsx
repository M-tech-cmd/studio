'use client';
import type { MemberProfile } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type SacramentBadgesProps = {
  profile: Partial<MemberProfile>;
};

const sacramentConfig = [
  { key: 'baptism', label: 'Baptism', initial: 'B' },
  { key: 'eucharist', label: 'Eucharist', initial: 'E' },
  { key: 'confirmation', label: 'Confirmation', initial: 'C' },
  { key: 'penance', label: 'Penance', initial: 'P' },
  { key: 'anointing', label: 'Anointing of the Sick', initial: 'A' },
  { key: 'matrimony', label: 'Matrimony', initial: 'M' },
  { key: 'holyOrders', label: 'Holy Orders', initial: 'H' },
] as const;

export function SacramentBadges({ profile }: SacramentBadgesProps) {
  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {sacramentConfig.map(({ key, label, initial }) => {
          const received = profile[key];
          return (
            <Tooltip key={key}>
              <TooltipTrigger>
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold',
                    received
                      ? 'border-green-500 bg-green-100 text-green-800'
                      : 'border-gray-300 bg-gray-100 text-gray-500'
                  )}
                >
                  {initial}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label}: {received ? 'Received' : 'Not Received'}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
