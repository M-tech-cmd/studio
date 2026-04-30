'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Landmark, Smartphone, Wallet, CheckCircle2, ChevronRight, History, Heart, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import type { FinancialEntry, SiteSettings } from '@/lib/types';
import { format } from 'date-fns';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

const AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function GivePage() {
    const [step, setStep] = useState(1);
    const [type, setType] = useState<'Tithe' | 'Offertory' | 'Project' | 'Donation'>('Tithe');
    const [amount, setAmount] = useState<number>(1000);
    const [customAmount, setCustomAmount] = useState('');
    const [method, setMethod] = useState<'M-Pesa' | 'Bank' | 'Cash'>('M-Pesa');
    
    const { user } = useUser();
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings } = useDoc<SiteSettings>(settingsRef);

    // Feature 3: History Logic
    const historyQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'financial_ledger'),
            where('entryType', '==', 'Individual'),
            where('memberName', '==', user.displayName || user.email),
            orderBy('date', 'desc')
        );
    }, [firestore, user]);
    const { data: history } = useCollection<FinancialEntry>(historyQuery);

    const handleSubmitRecord = async () => {
        if (!firestore || !user) return;
        try {
            await addDoc(collection(firestore, 'financial_ledger'), {
                amount,
                category: type,
                date: serverTimestamp(),
                entryType: 'Individual',
                memberName: user.displayName || user.email,
                notes: `Via Online Portal (${method})`,
                createdAt: serverTimestamp(),
            });
            setStep(4);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-transparent pb-20">
            <PageHeader 
                title="Stewardship & Giving" 
                subtitle="Honor the Lord with your wealth and with the firstfruits of all your produce. (Proverbs 3:9)" 
            />

            <section className="py-10">
                <div className="container max-w-5xl mx-auto px-4 grid lg:grid-cols-3 gap-12">
                    {/* Giving UI */}
                    <div className="lg:col-span-2">
                        {step === 1 && (
                            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-primary/5 p-10 border-b">
                                    <CardTitle className="text-3xl font-black uppercase tracking-tighter">1. Choose Allocation</CardTitle>
                                    <CardDescription>Select how you would like your contribution to be used.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['Tithe', 'Offertory', 'Project', 'Donation'] as const).map((t) => (
                                            <Button 
                                                key={t}
                                                variant={type === t ? 'default' : 'outline'}
                                                className={cn("h-24 rounded-2xl flex flex-col font-black uppercase tracking-widest gap-1 border-2", type === t && "shadow-lg scale-105")}
                                                onClick={() => setType(t)}
                                            >
                                                <DollarSign className="h-6 w-6" />
                                                {t}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Suggested Amounts (KES)</p>
                                        <div className="flex flex-wrap gap-3">
                                            {AMOUNTS.map((a) => (
                                                <Button 
                                                    key={a}
                                                    variant={amount === a ? 'secondary' : 'outline'}
                                                    className={cn("rounded-full h-12 px-6 font-bold border-2", amount === a && "border-primary bg-primary/10")}
                                                    onClick={() => { setAmount(a); setCustomAmount(''); }}
                                                >
                                                    {a.toLocaleString()}
                                                </Button>
                                            ))}
                                        </div>
                                        <Input 
                                            placeholder="Enter Custom Amount..." 
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) => {
                                                setCustomAmount(e.target.value);
                                                setAmount(Number(e.target.value));
                                            }}
                                            className="h-14 text-xl font-bold rounded-2xl border-2"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="p-10 bg-muted/5 flex justify-end">
                                    <Button onClick={() => setStep(2)} size="lg" className="rounded-full px-12 h-14 font-black uppercase tracking-widest shadow-xl">
                                        Continue <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 2 && (
                            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-primary/5 p-10 border-b">
                                    <CardTitle className="text-3xl font-black uppercase tracking-tighter">2. Payment Method</CardTitle>
                                    <CardDescription>We support various digital and cash options.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                    <div className="grid gap-4">
                                        {[
                                            { id: 'M-Pesa', icon: Smartphone, label: 'Lipa na M-Pesa' },
                                            { id: 'Bank', icon: Landmark, label: 'Direct Bank Transfer' },
                                            { id: 'Cash', icon: Wallet, label: 'Physical Cash / Office' },
                                        ].map((m) => (
                                            <Button 
                                                key={m.id}
                                                variant={method === m.id ? 'default' : 'outline'}
                                                className={cn("h-20 rounded-2xl justify-between px-8 font-black uppercase tracking-widest border-2", method === m.id && "shadow-lg")}
                                                onClick={() => setMethod(m.id as any)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <m.icon className="h-6 w-6" />
                                                    {m.label}
                                                </div>
                                                {method === m.id && <CheckCircle2 className="h-6 w-6" />}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-10 bg-muted/5 flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="font-bold uppercase tracking-widest"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                                    <Button onClick={() => setStep(3)} size="lg" className="rounded-full px-12 h-14 font-black uppercase tracking-widest shadow-xl">
                                        Get Instructions <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 3 && (
                            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-primary/5 p-10 border-b">
                                    <CardTitle className="text-3xl font-black uppercase tracking-tighter">3. Final Instructions</CardTitle>
                                    <CardDescription>Follow these steps to complete your {type.toLowerCase()} of KES {amount.toLocaleString()}.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10">
                                    {method === 'M-Pesa' && (
                                        <div className="bg-emerald-50 p-10 rounded-3xl border-2 border-emerald-100 text-emerald-950 text-center space-y-6">
                                            <Smartphone className="h-12 w-12 mx-auto" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Paybill Number</p>
                                                <p className="text-5xl font-black tracking-tighter">400222</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Account Name</p>
                                                <p className="text-3xl font-bold uppercase">ST MARTIN</p>
                                            </div>
                                        </div>
                                    )}

                                    {method === 'Bank' && (
                                        <div className="bg-blue-50 p-10 rounded-3xl border-2 border-blue-100 text-blue-950 space-y-6">
                                            <Landmark className="h-12 w-12" />
                                            <div className="space-y-4">
                                                <div><p className="text-[10px] font-black uppercase">Bank Name</p><p className="text-xl font-bold">Equity Bank Kenya</p></div>
                                                <div><p className="text-[10px] font-black uppercase">Account Number</p><p className="text-xl font-bold font-mono">01234567890</p></div>
                                                <div><p className="text-[10px] font-black uppercase">Branch</p><p className="text-xl font-bold">Nakuru East</p></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                                        <p className="text-sm font-medium text-amber-900 italic">
                                            "God loves a cheerful giver." Once you have completed the transaction, please notify the office by clicking the button below so we can record it in your member profile.
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-10 bg-muted/5 flex flex-col gap-4">
                                    <Button onClick={handleSubmitRecord} size="lg" className="w-full h-16 rounded-full font-black uppercase tracking-widest shadow-2xl">
                                        I HAVE SENT THE MONEY
                                    </Button>
                                    <Button variant="ghost" onClick={() => setStep(2)} className="font-bold uppercase">Cancel</Button>
                                </CardFooter>
                            </Card>
                        )}

                        {step === 4 && (
                            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden text-center animate-in zoom-in duration-500">
                                <CardContent className="p-20 space-y-6">
                                    <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle2 className="h-12 w-12" />
                                    </div>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter">Blessings Received!</h3>
                                    <p className="text-xl text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                        Your giving record has been submitted for verification. Thank you for supporting the mission of St. Martin De Porres.
                                    </p>
                                    <Button onClick={() => setStep(1)} className="rounded-full h-14 px-12 font-bold mt-10">Make Another Gift</Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* History Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
                            <CardHeader className="bg-primary/5 border-b">
                                <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    Your Giving History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {!user ? (
                                    <div className="text-center py-10 space-y-4">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sign in to track your gifts</p>
                                        <Button asChild variant="outline" className="rounded-full"><Link href="/login">Login</Link></Button>
                                    </div>
                                ) : history?.length === 0 ? (
                                    <div className="text-center py-10 italic text-muted-foreground text-sm">No records found yet.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {history?.slice(0, 5).map((entry) => (
                                            <div key={entry.id} className="flex justify-between items-center p-3 border-b border-dashed last:border-0">
                                                <div>
                                                    <p className="font-bold text-sm">KES {entry.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
                                                        {entry.category} • {format(entry.date instanceof Date ? entry.date : (entry.date as any).toDate(), 'MMM dd')}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-[8px] uppercase tracking-tighter">Verified</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="bg-slate-900 rounded-[2rem] p-10 text-white space-y-6 relative overflow-hidden isolate shadow-2xl">
                             <Heart className="h-32 w-32 absolute -bottom-10 -right-10 opacity-10 rotate-12" />
                             <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Support Our Mission</h4>
                             <p className="text-sm opacity-70 leading-relaxed font-medium">
                                Your contributions help us maintain the church, support our clergy, and reach out to the needy in our community.
                             </p>
                             <Button asChild variant="secondary" className="w-full rounded-full h-12 font-black uppercase tracking-widest text-[10px]">
                                <Link href="/development">Parish Projects Portfolio</Link>
                             </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
