'use client';

import { useState, useMemo } from 'react';
import { 
    PlusCircle, 
    Trash2, 
    DollarSign, 
    TrendingUp, 
    Calendar as CalendarIcon,
    User,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import type { FinancialEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const entrySchema = z.object({
  memberName: z.string().min(2, "Member name is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  category: z.enum(['Tithe', 'Offertory', 'Donation', 'Other']),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export default function AdminFinancialsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const financialQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'financial_ledger'), orderBy('date', 'desc'));
  }, [firestore]);
  
  const { data: financials, isLoading } = useCollection<FinancialEntry>(financialQuery);

  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      memberName: '',
      amount: 0,
      category: 'Tithe',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  const totals = useMemo(() => {
    if (!financials) return { tithe: 0, offertory: 0, other: 0, total: 0 };
    return financials.reduce((acc, entry) => {
        acc.total += entry.amount;
        if (entry.category === 'Tithe') acc.tithe += entry.amount;
        else if (entry.category === 'Offertory') acc.offertory += entry.amount;
        else acc.other += entry.amount;
        return acc;
    }, { tithe: 0, offertory: 0, other: 0, total: 0 });
  }, [financials]);

  const onSubmit = async (values: z.infer<typeof entrySchema>) => {
    if (!firestore) return;
    setIsSaving(true);

    // SAFE SERIALIZATION
    let dataToAdd = {};
    try {
        dataToAdd = {
            ...values,
            date: Timestamp.fromDate(new Date(values.date)),
            createdAt: serverTimestamp(),
        };
    } catch (e) {
        console.error("Data prep failed", e);
        toast({ variant: 'destructive', title: "Data Error", description: "Malformed entry data." });
        setIsSaving(false);
        return;
    }

    try {
        await addDoc(collection(firestore, 'financial_ledger'), dataToAdd);
        toast({ title: "Entry Recorded", description: "The financial entry has been logged successfully." });
        setIsDialogOpen(false);
        form.reset();
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'financial_ledger',
            operation: 'create',
            requestResourceData: dataToAdd
        }));
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, 'financial_ledger', id));
        toast({ title: "Entry Deleted" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Delete Failed", description: error.message });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">FINANCIAL LEDGER</h1>
          <p className="text-muted-foreground font-medium">Record tithes, offertory, and general donations.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Financial Contribution</DialogTitle>
                    <DialogDescription>Manually record a payment received from a parishioner.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="memberName" render={({ field }) => (
                            <FormItem><FormLabel>Member Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem><FormLabel>Amount (KES)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                    <SelectItem value="Tithe">Tithe</SelectItem>
                                    <SelectItem value="Offertory">Offertory</SelectItem>
                                    <SelectItem value="Donation">Donation</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent></Select></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem><FormLabel>Date Received</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Input placeholder="e.g. M-Pesa Ref ID" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="submit" disabled={isSaving} className="w-full">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                                Save Ledger Entry
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-emerald-50">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-800 flex items-center justify-between">
                    Total Revenue <ArrowUpRight className="h-4 w-4" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{formatCurrency(totals.total)}</div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-blue-50">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-800">Total Tithes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-blue-950">{formatCurrency(totals.tithe)}</div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-purple-50">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-purple-800">Total Offertory</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-purple-950">{formatCurrency(totals.offertory)}</div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-slate-50">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Other Collections</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-950">{formatCurrency(totals.other)}</div>
            </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Comprehensive list of all manually recorded contributions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : financials?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No financial records found.</TableCell></TableRow>
              ) : (
                (financials || []).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {entry.date ? format((entry.date as any).toDate ? (entry.date as any).toDate() : new Date(entry.date as any), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 font-bold">
                            <User className="h-3 w-3 text-primary" />
                            {entry.memberName}
                        </div>
                        {entry.notes && <p className="text-[10px] text-muted-foreground italic">{entry.notes}</p>}
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn(
                            "font-bold text-[10px] uppercase",
                            entry.category === 'Tithe' ? "border-blue-200 text-blue-700 bg-blue-50" :
                            entry.category === 'Offertory' ? "border-purple-200 text-purple-700 bg-purple-50" :
                            "border-slate-200 text-slate-700 bg-slate-50"
                        )}>
                            {entry.category}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-black text-emerald-700">
                        {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
