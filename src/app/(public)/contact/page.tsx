'use client';
import { Phone, Mail, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactForm } from '@/components/forms/ContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfficeHoursStatus } from '@/components/shared/OfficeHoursStatus';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { SiteSettings } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function ContactDetails() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);
    
    if (isLoading) {
        return (
             <div className="space-y-6">
                <Card className="bg-card/50 border-none shadow-md"><CardHeader className="p-4"><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="p-4 space-y-4"><Skeleton className="h-4 w-3/4" /></CardContent></Card>
                <Card className="bg-card/50 border-none shadow-md"><CardHeader className="p-4"><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            </div>
        )
    }

    const sanitizedPhone = settings?.phone ? settings.phone.replace(/\D/g, '') : '';

    return (
        <div className="space-y-6">
            <Card className="bg-card/50 border-none shadow-md">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg text-primary font-headline">Parish Office</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                    <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                        <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-snug">{settings?.address || 'Address not available'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                        <a href={`mailto:${settings?.email}`} className="text-muted-foreground hover:text-primary text-sm transition-colors">{settings?.email || 'Email not available'}</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                        {settings?.phone ? (
                          <a href={`tel:${sanitizedPhone}`} className="text-muted-foreground hover:text-primary text-sm transition-colors hover:underline">
                            {settings.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">Phone not available</span>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-card/50 border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                  <CardTitle className="text-lg text-primary font-headline">Office Hours</CardTitle>
                  {settings && <OfficeHoursStatus settings={settings} />}
                </CardHeader>
                <CardContent className="space-y-1 p-4 pt-0 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Monday - Friday</span>
                    <span>{settings?.officeHours?.monday_friday?.open || 'N/A'} - {settings?.officeHours?.monday_friday?.close || 'N/A'}</span>
                  </div>
                   <div className="flex justify-between text-muted-foreground">
                    <span>Saturday</span>
                    <span>{settings?.officeHours?.saturday?.open || 'Closed'} {settings?.officeHours?.saturday?.open && `- ${settings.officeHours.saturday.close}`}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sunday</span>
                    <span>{settings?.officeHours?.sunday?.open || 'Closed'} {settings?.officeHours?.sunday?.open && `- ${settings.officeHours.sunday.close}`}</span>
                  </div>
                </CardContent>
              </Card>
        </div>
    )
}

export default function ContactPage() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  return (
    <div className="bg-transparent">
      <PageHeader
        title={settings?.contactTitle || "Contact Us"}
        subtitle={settings?.contactDescription || "We'd love to hear from you. Get in touch with us for any inquiries or support."}
        titleColor={settings?.contactTitleColor}
        subtitleColor={settings?.contactDescriptionColor}
      />

      <section className="py-10 bg-transparent">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <ContactDetails />
            </div>
            <div className="lg:col-span-2">
               <Card className="bg-card/50 border-none shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl text-primary font-headline">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ContactForm />
                 </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-transparent">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-headline font-bold" style={{ color: settings?.findUsTitleColor }}>
                    {settings?.findUsTitle || 'Find Us'}
                </h2>
                <p className="text-muted-foreground mt-1 max-w-2xl mx-auto" style={{ color: settings?.findUsDescriptionColor }}>
                    {settings?.findUsDescription || "Located in the heart of Nakuru, we're easy to find and accessible to all."}
                </p>
            </div>
            <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg border-none">
                <iframe
                    src={settings?.googleMapsEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.155850982547!2d36.96331807496517!3d-1.119344398862828!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f479cbb904e4f%3A0xa6d33b5826a551e1!2sSt.%20Martin%20De%20Porres%20Catholic%20Church!5e0!3m2!1sen!2ske!4v1719593457917!5m2!1sen!2ske"}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Map of St. Martin De Porres Catholic Church"
                ></iframe>
            </div>
          </div>
        </section>
    </div>
  );
}
