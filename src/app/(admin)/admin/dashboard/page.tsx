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
  DollarSign,
  TrendingUp,
  Power,
  AlertTriangle,
  Loader2,
  ArrowRight,
  PlusCircle,
  Edit,
  Eye,
  Palette,
  Settings,
  Heart,
  Baby,
  User as UserIcon,
  PieChart,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import type { Event, RegisteredUser, FinancialEntry, SiteSettings, DevelopmentProject, MemberProfile, CommunityGroup } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GrowthChart } from '@/components/admin/GrowthChart';
import { OfficeHoursCard } from '@/components/admin/OfficeHoursCard';
import { useMemo, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const roleMapping: Record<string, string> = {
    admin: "St. Martin De Porres Admin",
    chairman: "St. Martin De Porres Chairman",
    treasurer: "St. Martin De Porres Treasurer",
    secretary: "St. Martin De Porres Secretary",
    tech_dev: "St. Martin De Porres Tech Developer",
};

function DashboardContent() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSavingStatus, setIsSavingStatus] = useState(false);
    
    // Core data fetching
    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userData, isLoading: userIsLoading } = useDoc<RegisteredUser>(userDocRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading: settingsLoading } = useDoc<SiteSettings>(settingsRef);

    const isAdmin = userData?.isAdmin;

    const eventsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'events') : null, [firestore]);
    const communityGroupsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'community_groups') : null, [firestore]);
    const devProjectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'development_projects') : null, [firestore]);
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const financialQuery = useMemoFirebase(() => firestore ? collection(firestore, 'financial_ledger') : null, [firestore]);
    const membersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'members') : null, [firestore]);
    const recentEventsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'events'), orderBy('date', 'desc'), limit(3)) : null, [firestore]);

    const { data: events, isLoading: eventsLoading } = useCollection(eventsQuery);
    const { data: communityGroups, isLoading: communityGroupsLoading } = useCollection<CommunityGroup>(communityGroupsQuery);
    const { data: devProjects, isLoading: devProjectsLoading } = useCollection<DevelopmentProject>(devProjectsQuery);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
    const { data: financials, isLoading: financialLoading } = useCollection<FinancialEntry>(financialQuery);
    const { data: members, isLoading: membersLoading } = useCollection<MemberProfile>(membersQuery);
    const { data: recentEvents, isLoading: recentEventsLoading } = useCollection<Event>(recentEventsQuery);

    // Dynamic Financial Calculations
    const financialsSummary = useMemo(() => {
        if (!financials) return { total: 0, byProject: {} as Record<string, number> };
        const summary = { total: 0, byProject: {} as Record<string, number> };
        
        financials.forEach(entry => {
            summary.total += entry.amount;
            if (entry.category === 'Project' && entry.projectId) {
                summary.byProject[entry.projectId] = (summary.byProject[entry.projectId] || 0) + entry.amount;
            }
        });
        return summary;
    }, [financials]);

    // Demographic Calculations (Updated for Group Affiliation Mapping)
    const demographics = useMemo(() => {
        if (!members || !communityGroups) return { men: 0, women: 0, youth: 0, children: 0, total: 0 };
        
        const groups = communityGroups as CommunityGroup[];
        
        // Helper to extract IDs based on name keywords provided in registry rules
        const getIds = (names: string[]) => 
            groups.filter(g => names.includes(g.name)).map(g => g.id);

        const menGroupIds = getIds(['CMA', 'Sacred Heart (Men)']);
        const womenGroupIds = getIds(['CWA', 'Sacred Heart (Women)']);
        const youthGroupIds = getIds(['MYM', 'YCA', 'YSC']);
        const childrenGroupIds = getIds(['PMC']);

        const stats = { men: 0, women: 0, youth: 0, children: 0, total: members.length };
        
        members.forEach(m => {
            const gid = m.parishGroupId || '';
            // unique counting per member profile document
            if (menGroupIds.includes(gid)) stats.men++;
            else if (womenGroupIds.includes(gid)) stats.women++;
            else if (youthGroupIds.includes(gid)) stats.youth++;
            else if (childrenGroupIds.includes(gid)) stats.children++;
        });
        
        return stats;
    }, [members, communityGroups]);

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

    const loading = userIsLoading || eventsLoading || communityGroupsLoading || devProjectsLoading || usersLoading || financialLoading || settingsLoading || membersLoading;

    const stats = [
        { title: 'Total Revenue', value: formatCurrency(financialsSummary.total), icon: DollarSign, href: '/admin/financials', color: 'bg-emerald-600' },
        { title: 'App Users', value: users?.length || 0, icon: UserCheck, href: '/admin/users', color: 'bg-pink-500' },
        { title: 'Registered Members', value: members?.length || 0, icon: Users, href: '/admin/members', color: 'bg-blue-500' },
        { title: 'Community Groups', value: communityGroups?.length || 0, icon: Church, href: '/admin/community', color: 'bg-purple-500' },
    ];

    const displayIdentity = userData?.isAdmin 
        ? (roleMapping[userData.role] || "St. Martin De Porres Admin")
        : (userData?.name || "Member");

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-none shadow-lg rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-primary/5 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tighter">Admin Control Center</CardTitle>
                                <CardDescription className="font-bold">{userData?.email} • Authorized Portal</CardDescription>
                            </div>
                            <Button asChild variant="outline" className="rounded-full font-bold border-2">
                                <Link href="/admin/branding"><Palette className="mr-2 h-4 w-4"/> Theme</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loading ? <Skeleton className="h-12 w-full" /> : (
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                                    <UserIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="font-black text-2xl tracking-tighter leading-none">{displayIdentity}</p>
                                    <Badge variant={isAdmin ? "destructive" : "secondary"} className="mt-2 uppercase font-black text-[9px] tracking-widest">
                                        {isAdmin ? (userData?.role || 'Administrator').toUpperCase() : 'Staff User'}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/20 rounded-2xl shadow-xl bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <Power className="h-4 w-4 text-primary" />
                            SITE VISIBILITY
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="maintenance" className="text-xs font-bold uppercase opacity-70">Maintenance Shield</Label>
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
                            <div className="animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-[10px] text-destructive font-black mb-2 uppercase">
                                    <AlertTriangle className="h-3 w-3" /> Public site is locked
                                </div>
                                <Textarea 
                                    placeholder="Maintenance reason..."
                                    className="text-xs min-h-[60px] rounded-xl"
                                    defaultValue={settings?.maintenanceMessage || ''}
                                    onBlur={(e) => updateDoc(settingsRef!, { maintenanceMessage: e.target.value })}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className={`${stat.color} text-white border-none shadow-lg rounded-2xl`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{loading ? <Skeleton className="h-8 w-20 bg-white/20" /> : stat.value}</div>
                            <Button asChild variant="secondary" size="sm" className="mt-4 w-full h-8 bg-white/10 hover:bg-white/20 border-none text-white font-bold rounded-lg">
                                <Link href={stat.href}>Manage Records</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Growth & Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <GrowthChart />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-2xl bg-slate-900 text-white overflow-hidden">
                    <CardHeader className="bg-white/5">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase font-black tracking-widest">
                            <PieChart className="h-4 w-4 text-primary" />
                            Parish Demographics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Total Men</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-primary">{demographics.men}</span>
                                    <UserIcon className="h-4 w-4 mb-1 opacity-20" />
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Total Women</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-pink-400">{demographics.women}</span>
                                    <Heart className="h-4 w-4 mb-1 opacity-20" />
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Total Youth</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-blue-400">{demographics.youth}</span>
                                    <Zap className="h-4 w-4 mb-1 opacity-20" />
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Total Children</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-orange-400">{demographics.children}</span>
                                    <Baby className="h-4 w-4 mb-1 opacity-20" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div>
                                <span className="text-[10px] font-black uppercase opacity-50 tracking-widest block">Global Registry</span>
                                <span className="text-sm font-black">{demographics.total} Unique Profiles</span>
                            </div>
                            <Users className="h-8 w-8 opacity-10" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Project Momentum
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {loading ? <Skeleton className="h-48 w-full" /> : (devProjects || []).slice(0, 4).map(project => {
                                const raised = financialsSummary.byProject[project.id] || 0;
                                const progress = Math.min(Math.round(((project.currentAmount + raised) / project.goalAmount) * 100), 100);
                                return (
                                    <div key={project.id} className="p-4 hover:bg-muted/10 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-sm">{project.title}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">{project.status}</p>
                                            </div>
                                            <span className="text-sm font-black text-emerald-600">{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-1.5 rounded-full" />
                                        <div className="flex justify-between mt-2 text-[9px] font-black uppercase opacity-60">
                                            <span>{formatCurrency(project.currentAmount + raised)}</span>
                                            <span>Goal: {formatCurrency(project.goalAmount)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <Button asChild variant="ghost" className="w-full h-12 rounded-none font-bold text-xs uppercase tracking-widest text-primary border-t">
                            <Link href="/admin/development">Full Project Portfolio <ArrowRight className="ml-2 h-3 w-3"/></Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            Registry Calendar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {loading ? <Skeleton className="h-48 w-full" /> : (recentEvents || []).map(event => (
                                <div key={event.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
                                    <div>
                                        <p className="font-bold text-sm leading-tight">{event.title}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">{format(new Date(event.date as any), 'MMMM do, yyyy')}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-full" asChild><Link href="/admin/events"><Edit className="h-4 w-4"/></Link></Button>
                                </div>
                            ))}
                        </div>
                        <Button asChild variant="ghost" className="w-full h-12 rounded-none font-bold text-xs uppercase tracking-widest text-primary border-t">
                            <Link href="/admin/events"><PlusCircle className="mr-2 h-3 w-3" /> Schedule Event</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function format(date: Date, pattern: string) {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Registry Dashboard</h1>
            <p className="text-muted-foreground font-medium">St. Martin De Porres Digital Infrastructure</p>
        </div>
        <Button asChild variant="outline" className="font-bold border-2 rounded-full h-12 px-6 hidden sm:flex">
            <Link href="/" target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Live Website
            </Link>
        </Button>
      </div>

      <DashboardContent />
    </div>
  );
}
