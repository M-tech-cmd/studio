'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { MemberProfile, RegisteredUser, CommunityGroup } from "@/lib/types";
import { useMemo } from "react";
import { Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function GrowthChart() {
    const firestore = useFirestore();
    
    const membersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'members') : null, [firestore]);
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const groupsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'community_groups') : null, [firestore]);
    
    const { data: members, isLoading: membersLoading } = useCollection<MemberProfile>(membersQuery);
    const { data: users, isLoading: usersLoading } = useCollection<RegisteredUser>(usersQuery);
    const { data: groups, isLoading: groupsLoading } = useCollection<CommunityGroup>(groupsQuery);
    
    const chartData = useMemo(() => {
        if (!members || !users || !groups) return [];

        const now = new Date();
        const months: { date: Date; key: string }[] = [];
        
        // Helper to extract IDs based on name keywords
        const getGroupIds = (names: string[]) => 
            groups.filter(g => names.includes(g.name)).map(g => g.id);

        const menGroupIds = getGroupIds(['CMA', 'Sacred Heart (Men)']);
        const womenGroupIds = getGroupIds(['CWA', 'Sacred Heart (Women)']);
        const youthGroupIds = getGroupIds(['MYM', 'YCA', 'YSC']);
        const childrenGroupIds = getGroupIds(['PMC']);

        // Generate last 12 months in ascending order
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                date,
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            });
        }
        
        return months.map(({ date, key }) => {
            let totalAppUsers = 0;
            let totalMen = 0;
            let totalWomen = 0;
            let totalYouth = 0;
            let totalChildren = 0;
            let monthlyProfileGrowth = 0;

            const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);

            // App Registrations
            users.forEach(user => {
                if (!user.dateJoined) return;
                const joinedAt = (user.dateJoined as any).toDate ? (user.dateJoined as any).toDate() : new Date(user.dateJoined as any);
                if (joinedAt < nextMonthStart) {
                    totalAppUsers++;
                }
            });

            // Member Profiles & Demographics
            members.forEach(member => {
                if (!member.createdAt) return;
                const createdAt = (member.createdAt as any).toDate ? (member.createdAt as any).toDate() : new Date(member.createdAt as any);
                
                if (createdAt < nextMonthStart) {
                    const gid = member.parishGroupId || '';
                    
                    if (menGroupIds.includes(gid)) totalMen++;
                    else if (womenGroupIds.includes(gid)) totalWomen++;
                    else if (youthGroupIds.includes(gid)) totalYouth++;
                    else if (childrenGroupIds.includes(gid)) totalChildren++;
                    
                    if (createdAt >= monthStart) {
                        monthlyProfileGrowth++;
                    }
                }
            });

            return {
                name: date.toLocaleString('default', { month: 'short' }),
                "New Profiles": monthlyProfileGrowth,
                "App Users": totalAppUsers,
                "Men": totalMen,
                "Women": totalWomen,
                "Youth": totalYouth,
                "Children": totalChildren,
            };
        });
    }, [members, users, groups]);
    
    if (membersLoading || usersLoading || groupsLoading) {
        return <Skeleton className="h-[350px] w-full" />;
    }

    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <ComposedChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        allowDecimals={false}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                            padding: '12px'
                        }}
                    />
                    <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                    
                    {/* Monthly Growth as Bar */}
                    <Bar dataKey="New Profiles" barSize={20} fill="#d4a574" radius={[4, 4, 0, 0]} opacity={0.6} />
                    
                    {/* Cumulative App Data as Area */}
                    <Area 
                        type="monotone" 
                        dataKey="App Users" 
                        stroke="#1e3a5f" 
                        fillOpacity={0.05} 
                        fill="#1e3a5f" 
                        strokeWidth={3}
                    />

                    {/* Demographic Series as Lines */}
                    <Line 
                        type="monotone" 
                        dataKey="Men" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="Women" 
                        stroke="#ec4899" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="Youth" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="Children" 
                        stroke="#f97316" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}