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

    useEffect(() => {
        if (settings?.paymentMethods) {
            setMethods(settings.paymentMethods);
        }
    }, [settings]);

    const handleAddMethod = () => {
        setMethods([...methods, { title: '', method: '', details: '', instructions: '', imageUrl: '' }]);
    };

    const handleRemoveMethod = (index: number) => {
        const newMethods = [...methods];
        newMethods.splice(index, 1);
        setMethods(newMethods);
    };

    const handleUpdateMethod = (index: number, field: keyof PaymentMethod, value: string) => {
        const newMethods = [...methods];
        newMethods[index] = { ...newMethods[index], [field]: value };
        setMethods(newMethods);
    };

    const handleSaveChanges = () => {
        if (!firestore || !settingsRef) return;

        // AUTH CHECK
        const isSuperAdmin = user?.email === 'kimaniemma20@gmail.com' || user?.uid === 'BKSmmIdohYQHlao5V9eZ9JQyaEV2';
        if (!isSuperAdmin && !settings?.isAdmin) {
             toast({ variant: 'destructive', title: "Unauthorized", description: "Access restricted to admins." });
            return;
        }

        // 1. INSTANT UI FEEDBACK (Non-Blocking)
        toast({ title: 'Success!', description: 'Payment methods updated in registry.' });
        router.push('/admin/dashboard');

        // 2. SILENT BACKGROUND SYNC
        const sanitizedMethods = methods.map(m => ({
            ...m,
            imageUrl: m.imageUrl?.startsWith('blob:') ? '' : m.imageUrl
        }));
        const updatedData = { paymentMethods: sanitizedMethods };
        
        updateDoc(settingsRef, updatedData)
            .catch((error) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                }));
            });
    }

    if (loading) return <div className="space-y-6 py-10"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6 py-10 max-w-5xl mx-auto px-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
                    <p className="text-muted-foreground">Add or update contribution details for parishioners.</p>
                </div>
                <Button onClick={handleAddMethod}><PlusCircle className="mr-2 h-4 w-4" /> Add Method</Button>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
                {methods.map((method, index) => (
                    <Card key={index} className="relative overflow-hidden border-2">
                        <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-destructive z-10" onClick={() => handleRemoveMethod(index)}><Trash2 className="h-5 w-5" /></Button>
                        <CardHeader className="bg-muted/30">
                            <CardTitle>Payment Configuration #{index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Payment Title (e.g. Offertory)</Label>
                                        <Input value={method.title} onChange={(e) => handleUpdateMethod(index, 'title', e.target.value)} autoComplete="off" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Provider Name (e.g. M-Pesa)</Label>
                                        <Input value={method.method} onChange={(e) => handleUpdateMethod(index, 'method', e.target.value)} autoComplete="off" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account / PayBill Details</Label>
                                        <Input value={method.details} onChange={(e) => handleUpdateMethod(index, 'details', e.target.value)} autoComplete="off" className="font-mono" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>User Instructions</Label>
                                        <Textarea value={method.instructions} onChange={(e) => handleUpdateMethod(index, 'instructions', e.target.value)} placeholder="Enter details on how to pay..." />
                                    </div>
                                </div>
                                <div>
                                    <ImageUpload 
                                      value={method.imageUrl || ''} 
                                      onChange={(url) => handleUpdateMethod(index, 'imageUrl', url)} 
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
                <Button size="lg" className="shadow-2xl rounded-full h-14 px-10" onClick={handleSaveChanges}>
                    <Save className="mr-2 h-5 w-5" />
                    Save Payment Settings
                </Button>
            </div>
        </div>
    );
}
