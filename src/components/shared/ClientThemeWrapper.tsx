'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';

function hexToHsl(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ClientThemeWrapper({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  // Button Color prioritizes local setting, then fallback to primaryColor
  const effectivePrimaryHex = settings?.globalButtonColor || settings?.primaryColor || '#d4a574';
  const primaryHsl = hexToHsl(effectivePrimaryHex);
  const textHsl = settings?.globalTextColor ? hexToHsl(settings.globalTextColor) : null;

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300 isolate-content antialiased font-body"
      style={{ 
        backgroundColor: settings?.secondaryColor || '#fdf2f2',
        color: settings?.globalTextColor || 'inherit'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${primaryHsl ? `--primary: ${primaryHsl}; --ring: ${primaryHsl};` : ''}
          ${textHsl ? `--foreground: ${textHsl}; --card-foreground: ${textHsl}; --popover-foreground: ${textHsl};` : ''}
          --primary-foreground: 0 0% 100% !important;
          --background: 0 0% 100%;
          --card: 0 0% 100%;
          --popover: 0 0% 100%;
        }
        
        header, .bg-card, .bg-background {
          background-color: #ffffff !important;
        }

        .isolate-content {
          position: relative;
          z-index: 1;
        }
      `}} />
      {children}
    </div>
  );
}
