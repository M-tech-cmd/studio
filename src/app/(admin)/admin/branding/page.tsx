'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RotateCcw, Palette as PaletteIcon, Loader2, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';

import type { SiteSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useMemoFirebase, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc, deleteField } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { uploadSingleFile } from '@/lib/upload-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const brandingSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  logoUrl: z.any().optional(),
  parishDescription: z.string().min(10, "Description is required"),
  copyrightYear: z.coerce.number().min(2020),
  heroTitle: z.string().optional(),
  heroTitleColor: z.string().optional(),
  heroDescriptionColor: z.string().optional(),
  heroImageUrl: z.any().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  globalTextColor: z.string().optional(),
  globalButtonColor: z.string().optional(),
  
  // Section text and colors
  massTitle: z.string().optional(), massDescription: z.string().optional(), massTitleColor: z.string().optional(), massDescriptionColor: z.string().optional(), massBoxColor: z.string().optional(),
  eventsTitle: z.string().optional(), eventsDescription: z.string().optional(), eventsTitleColor: z.string().optional(), eventsDescriptionColor: z.string().optional(), eventsBoxColor: z.string().optional(),
  clergyTitle: z.string().optional(), clergyDescription: z.string().optional(), clergyTitleColor: z.string().optional(), clergyDescriptionColor: z.string().optional(), clergyBoxColor: z.string().optional(),
  communityTitle: z.string().optional(), communityDescription: z.string().optional(), communityTitleColor: z.string().optional(), communityDescriptionColor: z.string().optional(), communityBoxColor: z.string().optional(),
  bulletinTitle: z.string().optional(), bulletinDescription: z.string().optional(), bulletinTitleColor: z.string().optional(), bulletinDescriptionColor: z.string().optional(), bulletinBoxColor: z.string().optional(),
  projectsTitle: z.string().optional(), projectsDescription: z.string().optional(), projectsTitleColor: z.string().optional(), projectsDescriptionColor: z.string().optional(), projectsBoxColor: z.string().optional(),
  bibleReadingsTitle: z.string().optional(), bibleReadingsDescription: z.string().optional(), bibleReadingsTitleColor: z.string().optional(), bibleReadingsDescriptionColor: z.string().optional(), bibleReadingsBoxColor: z.string().optional(),
  ministriesTitle: z.string().optional(), ministriesDescription: z.string().optional(), ministriesTitleColor: z.string().optional(), ministriesDescriptionColor: z.string().optional(), ministriesBoxColor: z.string().optional(),
  documentsTitle: z.string().optional(), documentsDescription: z.string().optional(), documentsTitleColor: z.string().optional(), documentsDescriptionColor: z.string().optional(), documentsBoxColor: z.string().optional(),
  paymentsTitle: z.string().optional(), paymentsDescription: z.string().optional(), paymentsTitleColor: z.string().optional(), paymentsDescriptionColor: z.string().optional(), paymentsBoxColor: z.string().optional(),
  contactTitle: z.string().optional(), contactDescription: z.string().optional(), contactTitleColor: z.string().optional(), contactDescriptionColor: z.string().optional(), contactBoxColor: z.string().optional(),
  aboutUsTitle: z.string().optional(), aboutUsDescription: z.string().optional(), aboutUsTitleColor: z.string().optional(), aboutUsDescriptionColor: z.string().optional(), aboutUsBoxColor: z.string().optional(),
});

const DEFAULT_BRANDING = {
    primaryColor: '#d4a574',
    secondaryColor: '#fdf2f2',
    globalTextColor: '#1e3a5f',
    globalButtonColor: '#d4a574',
    heroTitle: 'St. Martin De Porres Catholic Church',
    heroTitleColor: '#ffffff',
    heroDescriptionColor: '#e5e7eb',
    massTitle: 'Weekly Mass Schedule',
    eventsTitle: 'Upcoming Events',
    clergyTitle: 'Meet Our Clergy & Staff',
    communityTitle: 'Parish Communities',
    bulletinTitle: 'Latest Updates',
    projectsTitle: 'Parish Projects',
    bibleReadingsTitle: 'Daily Bible Readings',
    ministriesTitle: 'Our Ministries',
    documentsTitle: 'Parish Documents',
    paymentsTitle: 'Payments & Giving',
    contactTitle: 'Contact Us',
    aboutUsTitle: 'About St. Martin De Porres',
};

const SectionControls = ({ 
    form, 
    prefix, 
    label, 
    defaultTitle,
    defaultDesc,
    isHero = false
}: { 
    form: any, 
    prefix: string, 
    label: string,
    defaultTitle: string,
    defaultDesc: string,
    isHero?: boolean
}) => {
    const handleResetField = (field: string) => {
        form.setValue(field, '');
    };

    return (
        <Card className="mb-8 border-l-4 border-l-primary shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <CardHeader className="py-4 bg-muted/10 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-black uppercase tracking-tight">{label}</CardTitle>
                    <CardDescription className="text-xs font-medium">Text and visual overrides for the {label} section.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name={`${prefix}Title`} render={({field}) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Section Title</FormLabel>
                            <FormControl><Input {...field} value={field.value || ''} placeholder={defaultTitle} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name={`${prefix}Description`} render={({field}) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Sub-Title / Description</FormLabel>
                            <FormControl><Textarea {...field} value={field.value || ''} placeholder={defaultDesc} className="min-h-[40px] py-2" /></FormControl>
                        </FormItem>
                    )} />
                </div>

                {isHero && (
                    <FormField control={form.control} name="heroImageUrl" render={({field}) => (
                        <FormItem className="pt-4 border-t border-dashed">
                            <ImageUpload 
                                value={field.value} 
                                file={null} // Handled by manual file state in parent if needed, but hero is usually URL or Asset
                                onChange={(val) => field.onChange(val)}
                                label="Main Hero Background Image"
                            />
                        </FormItem>
                    )} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-dashed">
                    {[
                        { key: 'TitleColor', label: 'Title Color' },
                        { key: 'DescriptionColor', label: 'Desc Color' },
                        { key: 'BoxColor', label: 'Box Background' }
                    ].map((item) => (
                        <FormField key={item.key} control={form.control} name={`${prefix}${item.key}`} render={({field}) => (
                            <FormItem>
                                <FormLabel className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-2">{item.label}</FormLabel>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <div className="relative h-10 w-full group">
                                            <Input type="color" {...field} value={field.value || '#000000'} className="absolute inset-0 opacity-0 cursor-pointer h-full w-full z-10" />
                                            <div className="h-full w-full rounded-md border-2 border-muted flex items-center px-3 gap-3 pointer-events-none group-hover:border-primary/30 transition-colors">
                                                <div className="h-5 w-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: field.value || 'transparent' }} />
                                                <span className="text-[10px] font-mono font-bold uppercase">{field.value || 'Default'}</span>
                                            </div>
                                        </div>
                                    </FormControl>
                                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => handleResetField(`${prefix}${item.key}`)}>
                                        <RotateCcw className="h-3 w-3" />
                                    </Button>
                                </div>
                            </FormItem>
                        )} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default function BrandingPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);
    
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof brandingSchema>>({
        resolver: zodResolver(brandingSchema),
        defaultValues: {
            brandName: 'St. Martin De Porres',
            parishDescription: 'A community of faith, hope, and love serving the heart of Nakuru.',
            copyrightYear: new Date().getFullYear(),
            ...DEFAULT_BRANDING
        }
    });

    useEffect(() => {
        if(settings) {
            form.reset({
                ...settings,
                brandName: settings.brandName ?? 'St. Martin De Porres',
                parishDescription: settings.parishDescription ?? 'A community of faith, hope, and love serving the heart of Nakuru.',
                copyrightYear: settings.copyrightYear ?? new Date().getFullYear(),
            });
        }
    }, [settings, form]);

    const handleMasterReset = async () => {
        if (!settingsRef) return;
        setIsSaving(true);
        toast({ title: 'Resetting Global Theme...', description: 'Restoring Cathedral standards.' });

        try {
            await setDoc(settingsRef, {
                primaryColor: deleteField(),
                secondaryColor: deleteField(),
                globalTextColor: deleteField(),
                globalButtonColor: deleteField(),
                heroTitleColor: deleteField(),
                heroDescriptionColor: deleteField(),
                // Reset all section colors
                ...['mass', 'events', 'clergy', 'community', 'bulletin', 'projects', 'bibleReadings', 'ministries', 'documents', 'payments', 'contact', 'aboutUs'].reduce((acc, p) => ({
                    ...acc,
                    [`${p}TitleColor`]: deleteField(),
                    [`${p}DescriptionColor`]: deleteField(),
                    [`${p}BoxColor`]: deleteField(),
                }), {})
            }, { merge: true });
            
            toast({ title: 'Visuals Restored' });
            window.location.reload();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Reset Failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const onSubmitBranding = async (values: z.infer<typeof brandingSchema>) => {
        if (!settingsRef) return;
        setIsSaving(true);
        toast({ title: 'Synchronizing Identity...', description: 'Committing visual changes to registry.' });

        try {
            await setDoc(settingsRef, values, { merge: true });
            toast({ title: 'Visuals Synchronized' });
            router.push('/admin/dashboard');
        } catch (err: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: settingsRef.path,
                operation: 'update',
                requestResourceData: values
            }));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 space-y-8"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-96 w-full" /></div>;

    return (
        <div className="space-y-8 py-6 px-4 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner">
                        <PaletteIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase">Branding & Visuals</h1>
                        <p className="text-muted-foreground font-medium text-sm">Control the digital aesthetics of St. Martin De Porres.</p>
                    </div>
                </div>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="rounded-full border-2 font-bold gap-2 text-destructive hover:bg-destructive/10">
                            <RotateCcw className="h-4 w-4" /> Reset All Visuals
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                                Master Reset
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-lg">
                                This will purge all color overrides and restore the original <strong>Cathedral Palette</strong>. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel className="rounded-full h-12 px-8 font-bold">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleMasterReset} className="bg-destructive text-white rounded-full h-12 px-8 font-black">Execute Reset</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitBranding)} className="space-y-10 pb-32">
                    <Tabs defaultValue="identity" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-14 p-1 rounded-2xl bg-muted/20 border-2">
                            <TabsTrigger value="identity" className="rounded-xl font-bold uppercase tracking-widest text-xs">Identity & Global</TabsTrigger>
                            <TabsTrigger value="sections" className="rounded-xl font-bold uppercase tracking-widest text-xs">Section Overrides</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="identity" className="space-y-8 pt-8">
                            <Card className="shadow-lg border-2 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
                                <CardHeader className="bg-primary/5 border-b p-8">
                                    <CardTitle className="text-xl font-black uppercase tracking-widest">Primary Brand Identity</CardTitle>
                                    <CardDescription>Core naming and global palette settings.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <FormField control={form.control} name="brandName" render={({field}) => (
                                            <FormItem><FormLabel className="font-bold">Parish Brand Name</FormLabel><FormControl><Input {...field} className="h-12 font-bold" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="copyrightYear" render={({field}) => (
                                            <FormItem><FormLabel className="font-bold">Copyright Year</FormLabel><FormControl><Input type="number" {...field} className="h-12 font-bold" /></FormControl></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="parishDescription" render={({field}) => (
                                        <FormItem><FormLabel className="font-bold">Global Tagline (Footer/Meta)</FormLabel><FormControl><Textarea {...field} className="min-h-[80px]" /></FormControl></FormItem>
                                    )} />

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8 border-t border-dashed">
                                        {[
                                            { key: 'primaryColor', label: 'Primary Brand' },
                                            { key: 'secondaryColor', label: 'Global Background' },
                                            { key: 'globalTextColor', label: 'Global Text' },
                                            { key: 'globalButtonColor', label: 'Button / Accent' }
                                        ].map(color => (
                                            <FormField key={color.key} control={form.control} name={color.key as any} render={({field}) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase opacity-60">{color.label}</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <div className="relative h-12 w-full group">
                                                                <Input type="color" {...field} className="absolute inset-0 opacity-0 cursor-pointer h-full w-full z-10" />
                                                                <div className="h-full w-full rounded-xl border-2 flex items-center justify-center p-1" style={{ borderColor: field.value }}>
                                                                    <div className="h-full w-full rounded-lg" style={{ backgroundColor: field.value }} />
                                                                </div>
                                                            </div>
                                                        </FormControl>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => form.setValue(color.key as any, '')}><RotateCcw className="h-3 w-3"/></Button>
                                                    </div>
                                                </FormItem>
                                            ))} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <SectionControls 
                                form={form} 
                                prefix="hero" 
                                label="Main Hero Banner" 
                                defaultTitle={DEFAULT_BRANDING.heroTitle}
                                defaultDesc="A vibrant community of faith, hope, and love..."
                                isHero={true}
                            />
                        </TabsContent>

                        <TabsContent value="sections" className="space-y-6 pt-8">
                            <div className="grid gap-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Content Sections</h3>
                                <p className="text-sm text-muted-foreground mb-6 font-medium">Customize the wording and visual highlights for each homepage segment.</p>
                            </div>

                            <div className="space-y-4">
                                <SectionControls form={form} prefix="mass" label="Mass Schedule" defaultTitle="Weekly Mass Schedule" defaultDesc="Join us for worship and spiritual nourishment..." />
                                <SectionControls form={form} prefix="events" label="Upcoming Events" defaultTitle="Upcoming Events" defaultDesc="Stay active in our community with these spiritual gatherings." />
                                <SectionControls form={form} prefix="clergy" label="Meet Our Clergy" defaultTitle="Meet Our Clergy & Staff" defaultDesc="The dedicated team serving our vibrant parish family." />
                                <SectionControls form={form} prefix="community" label="Parish Communities" defaultTitle="Parish Communities" defaultDesc="Find fellowship and grow in faith with our Small Christian Communities." />
                                <SectionControls form={form} prefix="bulletin" label="Latest Updates" defaultTitle="Latest Updates" defaultDesc="Stay informed with the latest parish news and reflections." />
                                <SectionControls form={form} prefix="projects" label="Parish Projects" defaultTitle="Parish Projects" defaultDesc="Supporting our mission and growth through critical infrastructure." />
                                <SectionControls form={form} prefix="bibleReadings" label="Bible Readings" defaultTitle="Daily Bible Readings" defaultDesc="Nourish your soul with the Word of God each day." />
                                <SectionControls form={form} prefix="ministries" label="Our Ministries" defaultTitle="Our Ministries" defaultDesc="Serving God and our community through action." />
                                <SectionControls form={form} prefix="documents" label="Parish Documents" defaultTitle="Parish Documents" defaultDesc="Official bulletins, newsletters, and reports." />
                                <SectionControls form={form} prefix="payments" label="Payments & Giving" defaultTitle="Payments & Giving" defaultDesc="Support our mission through secure digital contributions." />
                                <SectionControls form={form} prefix="contact" label="Contact Us" defaultTitle="Contact Us" defaultDesc="We'd love to hear from you. Reach out for support or guidance." />
                                <SectionControls form={form} prefix="aboutUs" label="About Us" defaultTitle="About Us" defaultDesc="Learn about our 60-year history and mission." />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end sticky bottom-6 z-50 gap-4 pt-10">
                        <Button type="button" variant="outline" size="lg" className="rounded-full px-8 h-16 text-lg font-bold border-2 bg-white/80 backdrop-blur-md shadow-lg" onClick={() => router.push('/admin/dashboard')} disabled={isSaving}>
                            Cancel Changes
                        </Button>
                        <Button type="submit" size="lg" className="shadow-2xl rounded-full px-12 h-16 text-lg font-black uppercase tracking-widest gap-3" disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                            Save All Visuals
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
