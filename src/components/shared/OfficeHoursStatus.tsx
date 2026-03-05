
'use client';

import { useState, useEffect } from 'react';
import type { SiteSettings } from '@/lib/types';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

export function OfficeHoursStatus({ settings }: { settings: SiteSettings }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let hours;
      if (day >= 1 && day <= 5) { // Monday - Friday
        hours = settings.officeHours.monday_friday;
      } else if (day === 6) { // Saturday
        hours = settings.officeHours.saturday;
      } else { // Sunday
        hours = settings.officeHours.sunday;
      }

      let currentlyOpen = false;
      if (hours && hours.open && hours.close) {
        currentlyOpen = currentTime >= hours.open && currentTime < hours.close;
      }
      setIsOpen(currentlyOpen);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [settings]);

  return (
    <Badge className={cn(isOpen ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground')}>
      {isOpen ? 'Open Now' : 'Closed'}
    </Badge>
  );
}
