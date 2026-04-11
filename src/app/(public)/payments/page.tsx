'use client';

import Image from 'next/image';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Info, Copy, Check, CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteSettings, PaymentMethod, IconType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const PaymentIcon = ({ type, className }: { type?: IconType, className?: string }) => {
    switch (type) {
        case 'Bank': return <Landmark className={className} />;
        case 'Mobile': return <Smartphone className={className} />;
        case 'CreditCard': return <CreditCard className={className} />;
        case 'Cash': return <Wallet className={className} />;
        default: return <Wallet className={className} />;
    }
};

function PaymentCard({ method }: { method: PaymentMethod }) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(method.details);
        setCopied(true);
        toast({
            title: "Copied!",
            description: `${method.title} details copied to clipboard.`,
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="flex flex-col w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-none rounded-xl">
            <div className="relative w-full aspect-video bg-muted/5">
                {method.imageUrl ? (
                    <Image 
                        src={typeof method.imageUrl === 'string' ? method.imageUrl : `https://res.cloudinary.com/dojrqgd3l/image/upload/f_auto,q_auto/${method.imageUrl?.public_id}`} 
                        alt={method.title} 
                        fill 
                        className="object-contain p-4" 
                        unoptimized 
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground/30">
                        <PaymentIcon type={method.iconType} className="w-16 h-16" />
                    </div>
                )}
            </div>

            <CardContent className="p-6 flex-grow space-y-4">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {method.title}
                </h3>

                <div className="flex items-center gap-2">
                    <PaymentIcon type={method.iconType} className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                        {method.method}
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5 text-center">Account / PayBill Details</p>
                        <p className="font-mono text-lg font-black text-gray-900 break-all text-center">
                            {method.details}
                        </p>
                    </div>
                    
                    {method.instructions && (
                        <div className="px-1">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Instructions</p>
                            <p className="text-sm text-gray-700 italic leading-relaxed">
                                {method.instructions}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0 mt-auto">
                <Button 
                    onClick={handleCopy}
                    className="w-full shadow-md transition-all active:scale-95 rounded-lg font-bold h-12 text-md"
                >
                    {copied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
                    {copied ? 'Details Copied' : 'Copy Details'}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PaymentsPage() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading: loading } = useDoc<SiteSettings>(settingsRef);

    return (
        <div className="bg-transparent min-h-screen">
            <PageHeader
                title={settings?.paymentsTitle || "Payments & Giving"}
                subtitle={settings?.paymentsDescription || "Support our parish mission through secure digital payments."}
                titleColor={settings?.paymentsTitleColor}
                subtitleColor={settings?.paymentsDescriptionColor}
            />

            <section className="py-10 bg-transparent">
                <div className="container max-w-7xl mx-auto px-4">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
                                    <Skeleton className="aspect-video w-full" />
                                    <CardContent className="p-6 space-y-4">
                                        <Skeleton className="h-8 w-3/4" />
                                        <Skeleton className="h-16 w-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : !settings?.paymentMethods || settings.paymentMethods.length === 0 ? (
                        <Card className="text-center py-16 bg-white border-none shadow-md max-w-2xl mx-auto rounded-xl">
                            <CardContent>
                                <Info className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <h3 className="text-2xl font-bold text-gray-900">No payment methods found.</h3>
                                <p className="text-gray-500 mt-2">Please check back later or contact the parish office for guidance.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                            {settings.paymentMethods.map((method, index) => (
                                <PaymentCard key={index} method={method} />
                            ))}
                        </div>
                    )}

                    <div className="mt-16 max-w-3xl mx-auto text-center">
                        <p className="text-md text-gray-500 italic font-semibold">
                            "God loves a cheerful giver." (2 Corinthians 9:7)
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
