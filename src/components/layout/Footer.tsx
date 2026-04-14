'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, Twitter, Youtube, Instagram, Linkedin, Clock, Globe } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { SiteSettings, SocialLink } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { OfficeHoursStatus } from '../shared/OfficeHoursStatus';
import { useState, useEffect } from 'react';

/**
 * Mapping of common platform names to Lucide icons.
 */
const platformIconMap: Record<string, React.ElementType> = {
  'facebook': Facebook,
  'twitter': Twitter,
  'x': Twitter,
  'youtube': Youtube,
  'instagram': Instagram,
  'linkedin': Linkedin,
};

function FooterContent() {
  const firestore = useFirestore();
  
  // Site Settings for basic contact info
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<SiteSettings>(settingsRef);

  // Dynamic Social Links from registry
  const socialLinksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'social_links'), 
        where('is_active', '==', true),
        orderBy('sort_order', 'asc')
    );
  }, [firestore]);
  
  const { data: socialLinks, isLoading: socialLoading } = useCollection<SocialLink>(socialLinksQuery);

  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/events', label: 'Events' },
    { href: '/bulletin', label: 'Bulletin' },
    { href: '/community', label: 'Community' },
  ];

  const sanitizedPhone = settings?.phone ? settings.phone.replace(/\D/g, '') : '';

  return (
    <div className="container max-w-7xl mx-auto px-4 py-16 bg-transparent">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Identity */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <Logo url={settings?.logoUrl} className="h-12 w-12" />
              <span className="font-black text-xl tracking-tighter uppercase">{settings?.brandName || 'St. Martin De Porres'}</span>
            </Link>
            {settingsLoading ? <Skeleton className="h-20 w-full rounded-xl" /> : (
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {settings?.parishDescription || 'A stony, grand cathedral serving as a silent monument of faith in the urban landscape.'}
                </p>
            )}
            
            {/* Dynamic Social Registry Icons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {socialLoading ? (
                  <Skeleton className="h-8 w-32 rounded-full" />
              ) : (socialLinks || []).length > 0 ? (
                  socialLinks?.map((link) => {
                    const IconComp = platformIconMap[link.platform.toLowerCase()] || Globe;
                    return (
                      <Link 
                        key={link.id} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all hover:scale-110 border border-border/50"
                        title={link.platform}
                      >
                        <IconComp className="h-5 w-5" />
                      </Link>
                    );
                  })
              ) : null}
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="font-black mb-6 text-foreground uppercase tracking-[0.2em] text-[10px] opacity-50">Quick Navigation</h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary/20" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-black mb-6 text-foreground uppercase tracking-[0.2em] text-[10px] opacity-50">Registry Contact</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPin className="h-4 w-4" />
                </div>
                {settingsLoading ? <Skeleton className="h-10 w-full" /> : (
                    <span className="text-muted-foreground font-medium leading-snug">{settings?.address || 'Address information not set'}</span>
                )}
              </li>
              <li className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="h-4 w-4" />
                </div>
                {settingsLoading ? <Skeleton className="h-4 w-3/4" /> : (
                    settings?.email ? <a href={`mailto:${settings.email}`} className="text-muted-foreground font-bold hover:text-primary transition-colors truncate">{settings.email}</a> : <span className="text-muted-foreground">Email not set</span>
                )}
              </li>
              <li className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Phone className="h-4 w-4" />
                </div>
                {settingsLoading ? <Skeleton className="h-4 w-1/2" /> : (
                    settings?.phone ? (
                      <a href={`tel:${sanitizedPhone}`} className="text-muted-foreground font-bold hover:text-primary transition-colors hover:underline decoration-primary/30">
                        {settings.phone}
                      </a>
                    ) : <span className="text-muted-foreground">Phone not set</span>
                )}
              </li>
            </ul>
          </div>

          {/* Office Visibility */}
          <div>
            <h3 className="font-black mb-6 text-foreground uppercase tracking-[0.2em] text-[10px] opacity-50">Operational Hours</h3>
            {settings && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-dashed">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest">Status</span>
                        </div>
                        <OfficeHoursStatus settings={settings} />
                    </div>
                    <div className="space-y-2 pl-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-muted-foreground">Weekday (M-F):</span>
                            <span className="font-bold">{settings.officeHours?.monday_friday?.open || 'N/A'} - {settings.officeHours?.monday_friday?.close || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-muted-foreground">Weekend (Sat):</span>
                            <span className="font-bold">{settings.officeHours?.saturday?.open || 'Closed'} {settings.officeHours?.saturday?.open && `- ${settings.officeHours.saturday.close}`}</span>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Legal & Credits */}
        <div className="mt-20 pt-8 border-t border-dashed flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
           <p>&copy; {settings?.copyrightYear || currentYear} {settings?.brandName || 'ST. MARTIN DE PORRES'}. MISSION SECURED.</p>
           
           <div className="flex items-center gap-6">
                <Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                {settings?.developerCredit?.name && (
                    <p className="flex items-center gap-2">
                        System by <a href={settings.developerCredit.url} target="_blank" rel="noopener noreferrer" className="text-primary font-black hover:underline">{settings.developerCredit.name}</a>
                    </p>
                )}
           </div>
        </div>
      </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-white/50 backdrop-blur-sm border-t mt-auto">
      <FooterContent />
    </footer>
  );
}
