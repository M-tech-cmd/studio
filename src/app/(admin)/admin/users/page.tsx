
'use client';

import { useState } from 'react';
import type { RegisteredUser, VerificationIcon } from '@/lib/types';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserStatusIndicator } from '@/components/admin/UserStatusIndicator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ShieldAlert, CheckCircle2, Shield, Gavel, Code, Star, Award, User as UserIcon, FileDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const icons: { value: VerificationIcon; label: string; icon: any }[] = [
    { value: 'Check', label: 'Standard Check', icon: CheckCircle2 },
    { value: 'Shield', label: 'Admin Shield', icon: Shield },
    { value: 'Gavel', label: 'Chairman/Legal', icon: Gavel },
    { value: 'Code', label: 'Tech/Dev', icon: Code },
    { value: 'Star', label: 'Founder/Star', icon: Star },
    { value: 'Award', label: 'Honored/Award', icon: Award },
];

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);
  
  const { data: users, isLoading: usersLoading } = useCollection<RegisteredUser>(usersQuery);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    try {
      return format(d, 'MMMM do, yyyy');
    } catch (error) {
      return String(date);
    }
  };

  const downloadCSV = () => {
    if (!users || users.length === 0) return;
    
    const headers = ['Name', 'Email', 'Role', 'Status', 'Date Joined', 'Custom Title', 'Verified'];
    const rows = users.map(u => [
        u.name || 'N/A',
        u.email || 'N/A',
        u.role,
        u.status || 'Offline',
        u.dateJoined ? formatDate(u.dateJoined) : 'N/A',
        u.customTitle || '',
        u.isVerified ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `st_martin_users_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Generated", description: "Your member spreadsheet is ready." });
  };
  
  const getUserInitial = (user: RegisteredUser) => {
    return (user.name || user.email || 'U').charAt(0).toUpperCase();
  }
  
  const handleUpdateUser = (user: RegisteredUser, data: Partial<RegisteredUser>) => {
    if (!firestore || !currentUser) return;
    const userDocRef = doc(firestore, 'users', user.id);
    updateDoc(userDocRef, data)
        .then(() => toast({ title: "User Updated" }))
        .catch(() => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: data
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, 'users', userId));
        toast({ title: "User Deleted" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Delete Failed", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Registered Accounts</h1>
            <p className="text-muted-foreground font-medium">Manage verification, status, and administrative roles.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} className="font-bold border-2 gap-2">
                <FileDown className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="font-bold border-2 gap-2 hidden sm:flex">
                <Printer className="h-4 w-4" /> Print View
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle>System Registry ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">User Identity</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Custom Title</TableHead>
                <TableHead>Presence</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><span className="animate-pulse opacity-20">Synchronizing...</span></TableCell></TableRow>
              ) : (
                 (users || []).map((user) => {
                    const isAdmin = user.isAdmin === true;
                    const isCurrentUser = currentUser?.uid === user.id;
                    return (
                        <TableRow key={user.id} className="hover:bg-muted/30">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                                        <AvatarFallback className="bg-primary/5 text-primary font-bold">{getUserInitial(user)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5 font-bold truncate">
                                            {user.hideRealName && isAdmin ? `Official Office ${user.customTitle || 'Admin'}` : (user.name || 'N/A')}
                                            {user.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate opacity-70">{user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id={`verified-${user.id}`}
                                            checked={user.isVerified || false}
                                            onCheckedChange={(checked) => handleUpdateUser(user, { isVerified: checked })}
                                        />
                                        <Label htmlFor={`verified-${user.id}`} className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified</Label>
                                    </div>
                                    <Select 
                                        value={user.verificationIcon || 'Check'} 
                                        onValueChange={(val) => handleUpdateUser(user, { verificationIcon: val as VerificationIcon })}
                                    >
                                        <SelectTrigger className="h-7 text-[10px] w-[130px] font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {icons.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    <div className="flex items-center gap-2">
                                                        <item.icon className="h-3 w-3" />
                                                        <span>{item.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-2 max-w-[180px]">
                                    <Input 
                                        placeholder="e.g. Chairman" 
                                        className="h-7 text-[10px] font-bold" 
                                        defaultValue={user.customTitle || ''}
                                        onBlur={(e) => handleUpdateUser(user, { customTitle: e.target.value })}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id={`admin-${user.id}`}
                                            checked={isAdmin}
                                            onCheckedChange={(checked) => handleUpdateUser(user, { isAdmin: checked, role: checked ? 'admin' : 'user' })}
                                            disabled={isCurrentUser}
                                        />
                                        <Label htmlFor={`admin-${user.id}`} className="text-[9px] font-black uppercase opacity-50 tracking-tighter">Admin Power</Label>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <UserStatusIndicator status={user.status} lastSeen={user.lastSeen} />
                                <p className="text-[9px] font-black uppercase text-muted-foreground mt-1 opacity-50">Joined {formatDate(user.dateJoined)}</p>
                            </TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isCurrentUser} className="text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <ShieldAlert className="h-10 w-10 text-destructive mb-2" />
                                            <AlertDialogTitle>Account Termination</AlertDialogTitle>
                                            <AlertDialogDescription>Remove <strong>{user.email}</strong> from the parish registry? This action is irreversible.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Abort</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive text-white">Execute Deletion</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    )
                 })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
