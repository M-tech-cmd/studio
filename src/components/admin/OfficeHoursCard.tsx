
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Edit2, Save, Loader2 } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function OfficeHoursCard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [hours, setHours] = useState({
        monday_friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '12:00' },
        sunday: { open: '07:00', close: '20:00' }
    });

    useEffect(() => {
        if (settings?.officeHours) {
            setHours(settings.officeHours);
        }
    }, [settings]);

    useEffect(() => {
        const checkStatus = () => {
            if (settings?.officeHours) {
                const now = new Date();
                const day = now.getDay();
                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                let currentDayHours;
                if (day >= 1 && day <= 5) currentDayHours = settings.officeHours.monday_friday;
                else if (day === 6) currentDayHours = settings.officeHours.saturday;
                else currentDayHours = settings.officeHours.sunday;

                if (currentDayHours && currentDayHours.open && currentDayHours.close) {
                    setIsOpen(currentTime >= currentDayHours.open && currentTime < currentDayHours.close);
                } else {
                    setIsOpen(false);
                }
            }
        };

        checkStatus();
        const timer = setInterval(checkStatus, 60000); // Refresh every minute
        return () => clearInterval(timer);
    }, [settings]);

    const handleSave = async () => {
        if (!settingsRef) return;
        setIsSaving(true);
        const updatedData = { officeHours: hours };
        
        updateDoc(settingsRef, updatedData)
            .then(() => {
                toast({ title: "Success", description: "Office hours updated successfully." });
                setIsDialogOpen(false);
            })
            .catch((error: any) => {
                const permissionError = new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setIsSaving(false));
    };

    if (isLoading) return <Skeleton className="h-[200px] w-full" />;

    return (
        <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#d4a574]" />
                    <CardTitle className="text-sm font-bold tracking-wider uppercase">Office Hours</CardTitle>
                </div>
                <Badge className={isOpen ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}>
                    {isOpen ? 'OPEN' : 'CLOSED'}
                </Badge>
            </CardHeader>
            <CardContent className="pt-2 flex-grow">
                <div className="space-y-3 text-xs font-medium text-slate-400">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Mon - Fri</span>
                        <span className="text-white">{hours.monday_friday.open} - {hours.monday_friday.close}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Saturday</span>
                        <span className="text-white">{hours.saturday.open || 'Closed'} {hours.saturday.open && `- ${hours.saturday.close}`}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span>Sunday</span>
                        <span className="text-white">{hours.sunday.open || 'Closed'} {hours.sunday.open && `- ${hours.sunday.close}`}</span>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white border-none h-10">
                            <Edit2 className="mr-2 h-3 w-3" /> Manage Hours
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Office Hours</DialogTitle>
                            <DialogDescription>Set the opening and closing times for your parish office.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="space-y-4">
                                <Label className="text-primary font-bold">Monday - Friday</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mf-open" className="text-[10px] uppercase opacity-60">Open</Label>
                                        <Input id="mf-open" type="time" value={hours.monday_friday.open} onChange={(e) => setHours({ ...hours, monday_friday: { ...hours.monday_friday, open: e.target.value } })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mf-close" className="text-[10px] uppercase opacity-60">Close</Label>
                                        <Input id="mf-close" type="time" value={hours.monday_friday.close} onChange={(e) => setHours({ ...hours, monday_friday: { ...hours.monday_friday, close: e.target.value } })} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-2 border-t">
                                <Label className="text-primary font-bold">Saturday</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sat-open" className="text-[10px] uppercase opacity-60">Open</Label>
                                        <Input id="sat-open" type="time" value={hours.saturday.open} onChange={(e) => setHours({ ...hours, saturday: { ...hours.saturday, open: e.target.value } })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sat-close" className="text-[10px] uppercase opacity-60">Close</Label>
                                        <Input id="sat-close" type="time" value={hours.saturday.close} onChange={(e) => setHours({ ...hours, saturday: { ...hours.saturday, close: e.target.value } })} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-2 border-t">
                                <Label className="text-primary font-bold">Sunday</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sun-open" className="text-[10px] uppercase opacity-60">Open</Label>
                                        <Input id="sun-open" type="time" value={hours.sunday.open} onChange={(e) => setHours({ ...hours, sunday: { ...hours.sunday, open: e.target.value } })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sun-close" className="text-[10px] uppercase opacity-60">Close</Label>
                                        <Input id="sun-close" type="time" value={hours.sunday.close} onChange={(e) => setHours({ ...hours, sunday: { ...hours.sunday, close: e.target.value } })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Save Schedule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
