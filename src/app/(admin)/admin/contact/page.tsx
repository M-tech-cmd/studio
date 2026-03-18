'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock, RotateCcw, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useRouter } from 'next/navigation';

import type { SiteSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const officeHoursSchema = z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Use HH:MM format" }).or(z.literal('')),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Use HH:MM format" }).or(z.literal('')),
});

const socialLinkSchema = z.object({
    platform: z.enum(['Facebook', 'Twitter', 'YouTube', 'Instagram', 'LinkedIn']),
    url: z.string().url('Please enter a valid URL.').min(1, 'URL is required.'),
});

const contactSchema = z.object({
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Please enter a valid email"),
  googleMapsEmbedUrl: z.string().optional(),
  officeHours: z.object({
    monday_friday: officeHoursSchema,
    saturday: officeHoursSchema,
    sunday: officeHoursSchema,
  }),
  socialLinks: z.array(socialLinkSchema),
  whatsAppNumber: z.string().optional(),
  showWhatsAppChat: z.boolean().default(false),
});

export default function ContactSettingsPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            address: '', phone: '', email: '', googleMapsEmbedUrl: '',
            officeHours: { monday_friday: {open: '08:00', close: '18:00'}, saturday: {open: '09:00', close: '12:00'}, sunday: {open: '07:00', close: '20:00'} },
            socialLinks: [],
            whatsAppNumber: '',
            showWhatsAppChat: false,
        }
    });

    useEffect(() => {
        if(settings) {
            form.reset({
                address: settings.address ?? '',
                phone: settings.phone ?? '',
                email: settings.email ?? '',
                googleMapsEmbedUrl: settings.googleMapsEmbedUrl ?? '',
                officeHours: settings.officeHours ?? { monday_friday: {open: '08:00', close: '18:00'}, saturday: {open: '09:00', close: '12:00'}, sunday: {open: '07:00', close: '20:00'} },
                socialLinks: settings.socialLinks ?? [],
                whatsAppNumber: settings.whatsAppNumber ?? '',
                showWhatsAppChat: settings.showWhatsAppChat ?? false,
            });
        }
    }, [settings, form]);

    const handleInstantResetHours = async () => {
        if (!settingsRef) return;
        const defaultHours = { monday_friday: {open: '08:00', close: '18:00'}, saturday: {open: '09:00', close: '12:00'}, sunday: {open: '07:00', close: '20:00'} };
        form.setValue('officeHours', defaultHours);
        updateDoc(settingsRef, { officeHours: defaultHours });
        toast({ title: 'Hours Reset' });
    };

    const onSubmit = (values: z.infer<typeof contactSchema>) => {
        if (!settingsRef) return;
        // INSTANT SAVE UX
        toast({ title: 'Registry Synchronized', description: 'Contact details have been updated successfully.' });
        let sanitizedData = {};
        try {
            sanitizedData = JSON.parse(JSON.stringify(values));
        } catch (e) {
            sanitizedData = values;
        }
        setDoc(settingsRef, sanitizedData, { merge: true }).then(() => router.refresh());
    };

    if (isLoading) return <Skeleton className="h-96 w-full" />;

    return (
        <div className="space-y-6 py-6 px-4">
            <h1 className="text-3xl font-bold">Parish Contact & Map</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
                    <Card>
                        <CardHeader><CardTitle>Basic Contact Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="address" render={({field}) => <FormItem><FormLabel>Mailing Address</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl></FormItem>} />
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="phone" render={({field}) => <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>} />
                                <FormField control={form.control} name="email" render={({field}) => <FormItem><FormLabel>Public Email</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Office Hours</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={handleInstantResetHours}><RotateCcw className="h-3 w-3 mr-2" /> Reset Hours</Button>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-6">
                            {['monday_friday', 'saturday', 'sunday'].map((day) => (
                                <div key={day} className="space-y-4 p-4 border rounded-lg bg-muted/10">
                                    <h4 className="font-bold text-sm uppercase">{day.replace('_', ' - ')}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`officeHours.${day as any}.open`} render={({field}) => <FormItem><FormLabel className="text-[10px]">Open</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>} />
                                        <FormField control={form.control} name={`officeHours.${day as any}.close`} render={({field}) => <FormItem><FormLabel className="text-[10px]">Close</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Location & Map</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="googleMapsEmbedUrl" render={({field}) => (
                                <FormItem>
                                    <FormLabel>Google Maps Embed URL (src link)</FormLabel>
                                    <FormControl><Input {...field} value={field.value || ''} placeholder="https://www.google.com/maps/embed?pb=..." /></FormControl>
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end sticky bottom-6 z-50">
                        <Button type="submit" size="lg" className="shadow-2xl rounded-full h-14 px-10">
                            Commit Contact Info
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
