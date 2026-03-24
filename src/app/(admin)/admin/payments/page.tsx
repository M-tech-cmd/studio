'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { SiteSettings, PaymentMethod } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { uploadSingleFile } from '@/lib/upload-utils';

export default function AdminPaymentsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const { user } = useUser();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'main');
    }, [firestore]);

    const { data: settings, isLoading: loading } = useDoc<SiteSettings>(settingsRef);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [methodFiles, setMethodFiles] = useState<(File | null)[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings?.paymentMethods) {
            setMethods(settings.paymentMethods);
            setMethodFiles(new Array(settings.paymentMethods.length).fill(null));
        }
    }, [settings]);

    const handleAddMethod = () => {
        setMethods([...methods, { title: '', method: '', details: '', instructions: '', imageUrl: '' }]);
        setMethodFiles([...methodFiles, null]);
    };

    const handleRemoveMethod = (index: number) => {
        const newMethods = [...methods];
        newMethods.splice(index, 1);
        setMethods(newMethods);

        const newFiles = [...methodFiles];
        newFiles.splice(index, 1);
        setMethodFiles(newFiles);
    };

    const handleUpdateMethod = (index: number, field: keyof PaymentMethod, value: string, file?: File | null) => {
        const newMethods = [...methods];
        newMethods[index] = { ...newMethods[index], [field]: value };
        setMethods(newMethods);

        if (file !== undefined) {
            const newFiles = [...methodFiles];
            newFiles[index] = file;
            setMethodFiles(newFiles);
        }
    };

    const handleSaveChanges = async () => {
        if (!firestore || !settingsRef) return;

        // AUTH CHECK
        const isSuperAdmin = user?.email === 'kimaniemma20@gmail.com' || user?.uid === 'BKSmmIdohYQHlao5V9eZ9JQyaEV2';
        if (!isSuperAdmin && !settings?.isAdmin) {
             toast({ variant: 'destructive', title: "Unauthorized", description: "Access restricted to admins." });
            return;
        }

        setIsSaving(true);
        toast({ title: 'Syncing Records...', description: 'Uploading payment posters to the cloud.' });

        try {
            const finalMethods = [...methods];
            
            // Process uploads for any new files selected
            for (let i = 0; i < methodFiles.length; i++) {
                const file = methodFiles[i];
                if (file) {
                    const secureUrl = await uploadSingleFile(null, 'payments', file);
                    finalMethods[i].imageUrl = secureUrl;
                }
            }

            const updatedData = { paymentMethods: finalMethods };
            await updateDoc(settingsRef, updatedData);
            
            toast({ title: 'Success!', description: 'Payment methods updated in registry.' });
            router.push('/admin/dashboard');
        } catch (error: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: settingsRef.path,
                operation: 'update',
                requestResourceData: { paymentMethods: methods },
            }));
            toast({ variant: 'destructive', title: 'Sync Error', description: 'Upload failed. Check your connection.' });
        } finally {
            setIsSaving(false);
        }
    }

    if (loading) return <div className="space-y-6 py-10"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6 py-10 max-w-5xl mx-auto px-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
                    <p className="text-muted-foreground">Add or update contribution details for parishioners.</p>
                </div>
                <Button onClick={handleAddMethod} disabled={isSaving}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Method
                </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
                {methods.map((method, index) => (
                    <Card key={index} className="relative overflow-hidden border-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-4 right-4 text-destructive z-10" 
                            onClick={() => handleRemoveMethod(index)}
                            disabled={isSaving}
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <CardHeader className="bg-muted/30">
                            <CardTitle>Payment Configuration #{index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Payment Title (e.g. Offertory)</Label>
                                        <Input 
                                            value={method.title} 
                                            onChange={(e) => handleUpdateMethod(index, 'title', e.target.value)} 
                                            autoComplete="off" 
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Provider Name (e.g. M-Pesa)</Label>
                                        <Input 
                                            value={method.method} 
                                            onChange={(e) => handleUpdateMethod(index, 'method', e.target.value)} 
                                            autoComplete="off" 
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account / PayBill Details</Label>
                                        <Input 
                                            value={method.details} 
                                            onChange={(e) => handleUpdateMethod(index, 'details', e.target.value)} 
                                            autoComplete="off" 
                                            className="font-mono" 
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>User Instructions</Label>
                                        <Textarea 
                                            value={method.instructions} 
                                            onChange={(e) => handleUpdateMethod(index, 'instructions', e.target.value)} 
                                            placeholder="Enter details on how to pay..." 
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <ImageUpload 
                                      value={method.imageUrl || ''} 
                                      file={methodFiles[index]}
                                      onChange={(url, file) => handleUpdateMethod(index, 'imageUrl', url, file)} 
                                      folder="payments" 
                                      label="Method Poster/Icon" 
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="flex justify-end sticky bottom-6 z-50">
                <Button size="lg" className="shadow-2xl rounded-full h-14 px-10" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Skeleton className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
                    Save Payment Settings
                </Button>
            </div>
        </div>
    );
}
