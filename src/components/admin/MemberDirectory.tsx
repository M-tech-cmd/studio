'use client';

import { useState, useMemo } from 'react';
import type { MemberProfile, CommunityGroup } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileDown, Printer, Search, Filter, Users as UsersIcon } from 'lucide-react';
import { SacramentBadges } from './SacramentBadges';
import { MemberDetailModal } from './MemberDetailModal';
import { useToast } from '@/hooks/use-toast';

export function MemberDirectory() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sccFilter, setSccFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);

  const membersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'members'));
  }, [firestore]);
  
  const { data: members, loading: membersLoading } = useCollection<MemberProfile>(membersQuery);
  
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'community_groups'));
  }, [firestore]);
  
  const { data: allGroups, isLoading: groupsLoading } = useCollection<CommunityGroup>(groupsQuery);
  
  const { groupMap, sccGroups, otherGroups } = useMemo(() => {
    if (!allGroups) return { groupMap: {}, sccGroups: [], otherGroups: [] };
    const map: { [id: string]: CommunityGroup } = {};
    const sccs: CommunityGroup[] = [];
    const others: CommunityGroup[] = [];
    for (const group of allGroups) {
        map[group.id] = group;
        if (group.type === 'Small Christian Community') sccs.push(group);
        else others.push(group);
    }
    return { groupMap: map, sccGroups: sccs, otherGroups: others };
  }, [allGroups]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    const searchTermLower = searchTerm.toLowerCase();
    return members.filter(member => {
        const nameMatch = member.fullName?.toLowerCase().includes(searchTermLower);
        const sccFilterMatch = sccFilter === 'all' || member.sccId === sccFilter;
        const groupFilterMatch = groupFilter === 'all' || member.parishGroupId === groupFilter;
        return nameMatch && sccFilterMatch && groupFilterMatch;
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [members, searchTerm, sccFilter, groupFilter]);

  const downloadCSV = () => {
    if (!filteredMembers || filteredMembers.length === 0) return;
    
    const headers = [
        'Full Name', 'Age', 'Location', 'Phone', 'Profession', 
        'Jumuia (SCC)', 'Custom Jumuia', 'Parish Group', 'Custom Group', 
        'Mass Preference', 'Baptism', 'Eucharist', 'Confirmation', 'Children Count'
    ];
    
    const rows = filteredMembers.map(m => [
        `"${m.fullName}"`, 
        m.age, 
        `"${m.location}"`, 
        `"${m.phone || 'N/A'}"`, 
        `"${m.profession}"`,
        `"${groupMap[m.sccId]?.name || 'Other'}"`,
        `"${m.customSccName || ''}"`,
        `"${m.parishGroupId ? (groupMap[m.parishGroupId]?.name || 'Other') : 'None'}"`,
        `"${m.customParishGroupName || ''}"`,
        `"${m.sundayMassPreference}"`,
        m.baptism ? 'Yes' : 'No', 
        m.eucharist ? 'Yes' : 'No', 
        m.confirmation ? 'Yes' : 'No',
        m.children?.length || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `parish_directory_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast({ title: "CSV Generated", description: "The spreadsheet is ready for analysis." });
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(d, { addSuffix: true });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end mb-6">
        <div className="space-y-4 w-full md:max-w-3xl">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search parishioners by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12 text-lg border-2" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Select value={sccFilter} onValueChange={setSccFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-xs border-2"><Filter className="h-3 w-3 mr-2"/> <SelectValue placeholder="Filter Jumuia" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All SCCs</SelectItem>{sccGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-xs border-2"><Filter className="h-3 w-3 mr-2"/> <SelectValue placeholder="Filter Group" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Groups</SelectItem>{otherGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name} ({g.type})</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} className="h-12 border-2 font-bold gap-2"><FileDown className="h-5 w-5" /> Download CSV</Button>
            <Button variant="outline" onClick={() => window.print()} className="h-12 border-2 font-bold gap-2"><Printer className="h-5 w-5" /> Print</Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            Registry Records ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="font-bold">FullName</TableHead>
                <TableHead className="font-bold">Jumuia / SCC</TableHead>
                <TableHead className="font-bold">Parish Group</TableHead>
                <TableHead className="font-bold">Sacraments</TableHead>
                <TableHead className="font-bold">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersLoading || groupsLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse">Synchronizing records...</TableCell></TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No matching records found.</TableCell></TableRow>
              ) : (
                filteredMembers.map((member) => (
                    <TableRow key={member.id} onClick={() => setSelectedMember(member)} className="cursor-pointer hover:bg-primary/5 transition-colors">
                        <TableCell className="font-black text-primary">{member.fullName}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                                {member.sccId === 'other_scc' ? member.customSccName : (groupMap[member.sccId]?.name || 'Not Set')}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="font-bold">
                                {member.parishGroupId === 'other_group' ? member.customParishGroupName : (member.parishGroupId ? (groupMap[member.parishGroupId]?.name || 'None') : 'None')}
                            </Badge>
                        </TableCell>
                        <TableCell><SacramentBadges profile={member} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(member.createdAt)}</TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedMember && <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} groupMap={groupMap}/>}
    </>
  );
}
