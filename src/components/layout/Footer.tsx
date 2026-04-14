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

const socialIcons: Record<string, React.ElementType> = {
  'Facebook': Facebook,
  'Twitter': Twitter,
  'YouTube': Youtube,
  'Instagram': Instagram,
  'LinkedIn': Linkedin,
};

function FooterContent() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);
  
  // Dynamic Social Links from Firestore Registry
  const socialLinksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'social_links'), 
        where('is_active', '!=', false),
        orderBy('sort_order', 'asc')
    );
  }, [firestore]);
  
  const { data: socialLinks, isLoading: linksLoading } = useCollection<SocialLink>(socialLinksQuery);

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
    <div className="container max-w-7xl mx-auto px-4 py-8 bg-transparent">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Logo url={settings?.logoUrl} />
              <span className="font-bold text-lg">{settings?.brandName || 'St. Martin De Porres'}</span>
            </Link>
            {isLoading ? <Skeleton className="h-16 w-full" /> : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {settings?.parishDescription || 'A community of faith, hope, and love.'}
                </p>
            )}
            <div className="flex flex-wrap gap-4 pt-2">
              {linksLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-5 rounded-full" />)
              ) : (
                  socialLinks?.map((link) => {
                    const Icon = socialIcons[link.platform] || Globe;
                    return (
                      <Link 
                        key={link.id} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
                        title={link.platform}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    );
                  })
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground uppercase tracking-wider text-xs">Quick Links</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground uppercase tracking-wider text-xs">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                {isLoading ? <Skeleton className="h-10 w-full" /> : (
                    <span className="text-muted-foreground whitespace-pre-wrap">{settings?.address || 'Address information not set'}</span>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                {isLoading ? <Skeleton className="h-4 w-3/4" /> : (
                    settings?.email ? <a href={`mailto:${settings.email}`} className="text-muted-foreground hover:text-primary transition-colors">{settings.email}</a> : <span className="text-muted-foreground">Email not set</span>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                {isLoading ? <Skeleton className="h-4 w-1/2" /> : (
                    settings?.phone ? (
                      <a href={`tel:${sanitizedPhone}`} className="text-muted-foreground hover:text-primary transition-colors hover:underline decoration-primary/30">
                        {settings.phone}
                      </a>
                    ) : <span className="text-muted-foreground">Phone not set</span>
                )}
              </li>
              {settings && (
                <li className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-bold text-xs uppercase tracking-widest">Office Hours</span>
                    </div>
                    <div className="pl-8 space-y-1">
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] uppercase font-medium">Monday - Friday:</span>
                            <span className="text-[10px] font-bold">{settings.officeHours?.monday_friday?.open || 'N/A'} - {settings.officeHours?.monday_friday?.close || 'N/A'}</span>
                        </div>
                        <OfficeHoursStatus settings={settings} />
                    </div>
                </li>
              )}
            </ul>
          </div>

           <div>
            <h3 className="font-semibold mb-4 text-foreground uppercase tracking-wider text-xs">Legal</h3>
            <ul className="space-y-2">
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Use</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground space-y-2">
           <p>&copy; {settings?.copyrightYear || currentYear} {settings?.brandName || 'St. Martin De Porres Catholic Church'}. All Rights Reserved.</p>
           {isLoading ? <Skeleton className="h-4 w-48 mx-auto" /> : (
               settings?.developerCredit?.name && (
                <p>Developed by <a href={settings.developerCredit.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{settings.developerCredit.name}</a></p>
               )
           )}
        </div>
      </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-transparent text-card-foreground border-t mt-auto">
      <FooterContent />
    </footer>
  );
}
