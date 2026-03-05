
'use client';

import Link from 'next/link';
import {
  Calendar,
  Users,
  FileText,
  Church,
  Briefcase,
  BookOpen,
  UserCheck,
  CreditCard,
  Settings,
  Edit,
  PlusCircle,
  ArrowRight,
  Eye,
  Palette,
  DollarSign,
  TrendingUp,
  Power,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import type { Event, RegisteredUser, FinancialEntry, SiteSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GrowthChart } from '@/components/admin/GrowthChart';
import { OfficeHoursCard } from '@/components/admin/OfficeHoursCard';
import { useMemo, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';


function DashboardContent() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSavingStatus, setIsSavingStatus] = useState(false);
    
    // User profile data fetching
    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userData, isLoading: userIsLoading } = useDoc<RegisteredUser>(userDocRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading: settingsLoading } = useDoc<SiteSettings>(settingsRef);

    // Admin role check from user document
    const isAdmin = userData?.isAdmin;

    const eventsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'events') : null, [firestore]);
    const profilesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'profiles') : null, [firestore]);
    const documentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'documents') : null, [firestore]);
    const communityGroupsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'community_groups') : null, [firestore]);
    const devProjectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'development_projects') : null, [firestore]);
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const recentEventsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'events'), orderBy('date', 'desc'), limit(5)) : null, [firestore]);
    const financialQuery = useMemoFirebase(() => firestore ? collection(firestore, 'financial_ledger') : null, [firestore]);

    const { data: events, isLoading: eventsLoading } = useCollection(eventsQuery);
    const { data: profiles, isLoading: profilesLoading } = useCollection(profilesQuery);
    const { data: documents, isLoading: documentsLoading } = useCollection(documentsQuery);
    const { data: communityGroups, isLoading: communityGroupsLoading } = useCollection(communityGroupsQuery);
    const { data: devProjects, isLoading: devProjectsLoading } = useCollection(devProjectsQuery);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
    const { data: recentEvents, isLoading: recentEventsLoading } = useCollection<Event>(recentEventsQuery);
    const { data: financials, isLoading: financialLoading } = useCollection<FinancialEntry>(financialQuery);

    const totalRevenue = useMemo(() => {
        if (!financials) return 0;
        return financials.reduce((sum, entry) => sum + entry.amount, 0);
    }, [financials]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
    };

    const handleMaintenanceToggle = async (checked: boolean) => {
        if (!settingsRef) return;
        setIsSavingStatus(true);
        const updateData = { maintenanceMode: checked };
        
        updateDoc(settingsRef, updateData)
            .then(() => toast({ title: checked ? "Maintenance Mode Active" : "Site is Live" }))
            .catch((err) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                }));
            })
            .finally(() => setIsSavingStatus(false));
    }

    const handleUpdateMessage = (val: string) => {
        if (!settingsRef) return;
        updateDoc(settingsRef, { maintenanceMessage: val });
    }

    const loading = userIsLoading || eventsLoading || profilesLoading || documentsLoading || communityGroupsLoading || devProjectsLoading || usersLoading || recentEventsLoading || financialLoading || settingsLoading;

    const stats = [
        { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, href: '/admin/financials', color: 'bg-emerald-600' },
        { title: 'App Users', value: users?.length, icon: UserCheck, href: '/admin/users', color: 'bg-pink-500' },
        { title: 'Total Events', value: events?.length, icon: Calendar, href: '/admin/events', color: 'bg-blue-500' },
        { title: 'Community Groups', value: communityGroups?.length, icon: Church, href: '/admin/community', color: 'bg-purple-500' },
        { title: 'Staff Profiles', value: profiles?.length, icon: Users, href: '/admin/profiles', color: 'bg-teal-500' },
        { title: 'Documents', value: documents?.length, icon: FileText, href: '/admin/documents', color: 'bg-orange-500' },
        { title: 'Dev. Projects', value: devProjects?.length, icon: Briefcase, href: '/admin/development', color: 'bg-green-500' },
        { title: 'Site Branding', value: 'Manage', icon: Palette, href: '/admin/branding', color: 'bg-cyan-500' },
    ];
    
    const getDateString = (date: any) => {
        if (!date) return 'No date';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Admin Session</CardTitle>
                        <CardDescription>Logged in as {userData?.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                        ) : userData ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-xl">{userData.name}</p>
                                    <div className="text-sm mt-1">Role: 
                                        <Badge variant={isAdmin ? "destructive" : "secondary"} className="ml-2 uppercase font-black text-[10px]">
                                            {isAdmin ? 'Authorized Admin' : 'Standard User'}
                                        </Badge>
                                    </div>
                                </div>
                                <Button asChild variant="outline">
                                    <Link href="/admin/branding"><Palette className="mr-2 h-4 w-4"/> Theme Designer</Link>
                                </Button>
                            </div>
                        ) : (
                            <p>Could not load user profile.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <Power className="h-4 w-4 text-primary" />
                            SITE STATUS
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="maintenance" className="text-xs font-bold uppercase opacity-70">Maintenance Mode</Label>
                            <div className="flex items-center gap-2">
                                {isSavingStatus && <Loader2 className="h-3 w-3 animate-spin" />}
                                <Switch 
                                    id="maintenance" 
                                    checked={settings?.maintenanceMode || false} 
                                    onCheckedChange={handleMaintenanceToggle}
                                />
                            </div>
                        </div>
                        {settings?.maintenanceMode && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-[10px] text-destructive font-black mb-2 uppercase">
                                    <AlertTriangle className="h-3 w-3" /> Public site is currently hidden
                                </div>
                                <Textarea 
                                    placeholder="Enter reason for downtime..."
                                    className="text-xs min-h-[60px]"
                                    defaultValue={settings?.maintenanceMessage || ''}
                                    onBlur={(e) => handleUpdateMessage(e.target.value)}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                <Card key={stat.title} className={`${stat.color} text-white border-none shadow-lg`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 opacity-80" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold tracking-tight">{loading && typeof stat.value === 'number' ? <Skeleton className="h-8 w-10 bg-white/20" /> : stat.value}</div>
                    <Button asChild variant="secondary" size="sm" className="mt-4 w-full h-8 bg-white/10 hover:bg-white/20 border-none text-white font-bold">
                        <Link href={stat.href}>Manage {stat.title.split(" ")[1] || 'Details'}</Link>
                    </Button>
                    </CardContent>
                </Card>
                ))}
                
                <OfficeHoursCard />

                <Card className="bg-slate-800 text-white border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Static Pages</CardTitle>
                        <Settings className="h-4 w-4 opacity-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Content Editor</div>
                        <Button asChild variant="secondary" size="sm" className="mt-4 w-full h-8 bg-white/10 hover:bg-white/20 border-none text-white font-bold">
                            <Link href="/admin/branding">Edit Pages</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                <Card className="lg:col-span-3 border-none shadow-md">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Growth Analytics</CardTitle>
                                <CardDescription>Tracking app registrations and community profiles.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <GrowthChart />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center"><ArrowRight className="mr-2 h-5 w-5 text-primary" /> Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-2">
                            {quickActions.map((action) => (
                                <Link
                                key={action.href}
                                href={action.href}
                                className="flex items-center justify-between p-3 rounded-md hover:bg-muted text-sm font-bold transition-colors group"
                                >
                                <span>{action.title}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6 border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Recent Events & Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 rounded-md">
                            <div>
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-8 w-8" />
                        </div>
                    )) : (recentEvents || []).slice(0,3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between text-sm p-3 rounded-lg border hover:bg-muted transition-colors">
                        <div>
                        <p className="font-bold">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{getDateString(event.date)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/admin/events`}>
                                <Edit className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    ))}
                    <Button variant="outline" className="w-full mt-4 font-bold h-12" asChild>
                        <Link href="/admin/events">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Schedule New Parish Event
                        </Link>
                    </Button>
                </CardContent>
            </Card>

        </>
    )
}

const quickActions = [
    { title: 'Log Tithe or Offertory', href: '/admin/financials' },
    { title: 'Update Mass Schedule', href: '/admin/masses' },
    { title: 'Post to Community Bulletin', href: '/admin/bulletin' },
    { title: 'Manage Registered Members', href: '/admin/members' },
    { title: 'Upload Church Documents', href: '/admin/documents' },
    { title: 'Manage Site Visuals & Banners', href: '/admin/branding' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-black tracking-tighter">ADMIN DASHBOARD</h1>
            <p className="text-muted-foreground font-medium">Control center for St. Martin De Porres Parish</p>
        </div>
        <Button asChild variant="outline" className="font-bold border-2">
            <Link href="/" target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                View Public Website
            </Link>
        </Button>
      </div>

      <DashboardContent />
      
    </div>
  );
}
