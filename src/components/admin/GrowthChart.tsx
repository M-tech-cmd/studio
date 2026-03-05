'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { MemberProfile, RegisteredUser } from "@/lib/types";
import { useMemo } from "react";
import { Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function GrowthChart() {
    const firestore = useFirestore();
    
    const membersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'members') : null, [firestore]);
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    
    const { data: members, isLoading: membersLoading } = useCollection<MemberProfile>(membersQuery);
    const { data: users, isLoading: usersLoading } = useCollection<RegisteredUser>(usersQuery);
    
    const chartData = useMemo(() => {
        if (!members || !users) return [];

        const now = new Date();
        const months: { date: Date; key: string }[] = [];
        
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
            let totalCommunityMembers = 0;
            let totalYouth = 0;
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

            // Member Profiles
            members.forEach(member => {
                if (!member.createdAt) return;
                const createdAt = (member.createdAt as any).toDate ? (member.createdAt as any).toDate() : new Date(member.createdAt as any);
                
                if (createdAt < nextMonthStart) {
                    totalCommunityMembers++;
                    if (member.groupType === 'YCS' || member.groupType === 'YCA') totalYouth++;
                    
                    if (createdAt >= monthStart) {
                        monthlyProfileGrowth++;
                    }
                }
            });

            return {
                name: date.toLocaleString('default', { month: 'short' }),
                "App Users": totalAppUsers,
                "Community Members": totalCommunityMembers,
                "Youth/Children": totalYouth,
                "New Profiles": monthlyProfileGrowth,
            };
        });
    }, [members, users]);
    
    if (membersLoading || usersLoading) {
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
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="top" align="right" height={36}/>
                    
                    {/* New Profile Growth as Bars */}
                    <Bar dataKey="New Profiles" barSize={20} fill="#d4a574" radius={[4, 4, 0, 0]} opacity={0.6} />
                    
                    {/* Cumulative Data as Lines/Areas */}
                    <Area 
                        type="monotone" 
                        dataKey="App Users" 
                        stroke="#1e3a5f" 
                        fillOpacity={0.1} 
                        fill="#1e3a5f" 
                        strokeWidth={3}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="Community Members" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                        activeDot={{ r: 6 }} 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="Youth/Children" 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}