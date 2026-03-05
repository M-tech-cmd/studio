'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, Link as LinkIcon, X, PlusCircle, Trash2, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useStorage, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { SiteSettings, PaymentMethod } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function AdminPaymentsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    const { user } = useUser();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'main');
    }, [firestore]);

    const { data: settings, isLoading: loading } = useDoc<SiteSettings>(settingsRef);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [previews, setPreviews] = useState<{ [key: number]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

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
        
        const newPreviews = { ...previews };
        delete newPreviews[index];
        setPreviews(newPreviews);
    };

    const handleUpdateMethod = (index: number, field: keyof PaymentMethod, value: string) => {
        const newMethods = [...methods];
        newMethods[index] = { ...newMethods[index], [field]: value };
        setMethods(newMethods);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file || !storage) return;

        // Instant Preview logic
        const localUrl = URL.createObjectURL(file);
        setPreviews(prev => ({ ...prev, [index]: localUrl }));

        try {
            const storageRef = ref(storage, `payments/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            handleUpdateMethod(index, 'imageUrl', downloadURL);
            toast({ title: 'Upload Finished', description: 'Poster is ready to save.' });
        } catch (error: any) {
            console.error("Upload failed:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
            setPreviews(prev => {
                const n = { ...prev };
                delete n[index];
                return n;
            });
        }
    };

    const handleSaveChanges = () => {
        if (!firestore || !settingsRef) return;

        const isSuperAdmin = user?.email === 'kimaniemma20@gmail.com' || user?.uid === 'BKSmmIdohYQHlao5V9eZ9JQyaEV2';
        if (!isSuperAdmin && !settings?.isAdmin) {
             toast({ variant: 'destructive', title: "Unauthorized", description: "Access restricted to admins." });
            return;
        }

        setIsSaving(true);
        const updatedData = { paymentMethods: methods };
        
        updateDoc(settingsRef, updatedData)
            .then(() => {
                toast({ title: 'Success!', description: 'Payment methods updated.' });
                router.refresh();
            })
            .catch((error) => {
                const permissionError = new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setIsSaving(false));
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
                    <Card key={index} className="relative">
                        <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-destructive" onClick={() => handleRemoveMethod(index)}><Trash2 className="h-5 w-5" /></Button>
                        <CardHeader>
                            <CardTitle>Method #{index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label>Title (The Goal)</Label><Input value={method.title} onChange={(e) => handleUpdateMethod(index, 'title', e.target.value)} placeholder="e.g., Church Tithe" /></div>
                                    <div className="space-y-2"><Label>Payment Way (The Method)</Label><Input value={method.method} onChange={(e) => handleUpdateMethod(index, 'method', e.target.value)} placeholder="e.g., M-Pesa" /></div>
                                    <div className="space-y-2"><Label>Account Number / Details</Label><Input value={method.details} onChange={(e) => handleUpdateMethod(index, 'details', e.target.value)} placeholder="e.g., PayBill 123456" /></div>
                                    <div className="space-y-2"><Label>Instructions</Label><Textarea value={method.instructions} onChange={(e) => handleUpdateMethod(index, 'instructions', e.target.value)} placeholder="e.g., Enter your name as account..." /></div>
                                </div>
                                <div className="space-y-4">
                                    <Label>Poster Image</Label>
                                    <Tabs defaultValue="upload">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4"/> File</TabsTrigger>
                                            <TabsTrigger value="url"><LinkIcon className="mr-2 h-4 w-4"/> URL</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="upload" className="pt-2">
                                            <label htmlFor={`f-${index}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                                <Upload className="w-8 h-8 text-muted-foreground" />
                                                <input id={`f-${index}`} type="file" className="hidden" onChange={(e) => handleFileChange(e, index)} accept="image/*" />
                                            </label>
                                        </TabsContent>
                                        <TabsContent value="url" className="pt-2"><Input value={method.imageUrl || ''} onChange={(e) => handleUpdateMethod(index, 'imageUrl', e.target.value)} placeholder="https://..." /></TabsContent>
                                    </Tabs>
                                    {(previews[index] || method.imageUrl) && (
                                        <div className="relative w-full aspect-video rounded-md border p-2 bg-muted/10">
                                            <Image src={previews[index] || method.imageUrl!} alt="Preview" fill className="object-contain" unoptimized />
                                            <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full" onClick={() => { handleUpdateMethod(index, 'imageUrl', ''); setPreviews(prev => ({ ...prev, [index]: '' })) }}><X className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="flex justify-end sticky bottom-6 z-50">
                <Button size="lg" className="shadow-2xl rounded-full h-14 px-10" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Save All Changes
                </Button>
            </div>
        </div>
    );
}