'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
    PlusCircle, 
    Trash2, 
    DollarSign, 
    TrendingUp, 
    Calendar as CalendarIcon,
    User,
    ArrowUpRight,
    Loader2,
    Users,
    Pencil
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import type { FinancialEntry, DevelopmentProject } from '@/lib/types';
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
import { collection, deleteDoc, doc, orderBy, query, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const entrySchema = z.object({
  entryType: z.enum(['Individual', 'General']),
  memberName: z.string().optional(),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  category: z.enum(['Tithe', 'Offertory', 'Donation', 'Project', 'Other']),
  projectId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
}).refine(data => data.entryType === 'General' || (data.entryType === 'Individual' && data.memberName), {
    message: "Member name is required for individual entries",
    path: ["memberName"]
});

export default function AdminFinancialsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null);

  const financialQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'financial_ledger'), orderBy('date', 'desc'));
  }, [firestore]);
  
  const { data: financials, isLoading } = useCollection<FinancialEntry>(financialQuery);

  const projectsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'development_projects');
  }, [firestore]);
  
  const { data: projects } = useCollection<DevelopmentProject>(projectsQuery);

  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      entryType: 'Individual',
      memberName: '',
      amount: 0,
      category: 'Tithe',
      projectId: 'none',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  const entryType = form.watch('entryType');
  const category = form.watch('category');

  // Handle Edit Pre-population
  useEffect(() => {
    if (selectedEntry) {
        const entryDate = (selectedEntry.date as any).toDate ? (selectedEntry.date as any).toDate() : new Date(selectedEntry.date as any);
        form.reset({
            entryType: selectedEntry.entryType || 'Individual',
            memberName: selectedEntry.memberName === 'General Collection' ? '' : selectedEntry.memberName,
            amount: selectedEntry.amount,
            category: selectedEntry.category,
            projectId: selectedEntry.projectId || 'none',
            date: format(entryDate, 'yyyy-MM-dd'),
            notes: selectedEntry.notes || '',
        });
    } else {
        form.reset({
            entryType: 'Individual',
            memberName: '',
            amount: 0,
            category: 'Tithe',
            projectId: 'none',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: '',
        });
    }
  }, [selectedEntry, form]);

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

    const dataToSave = {
        ...values,
        memberName: values.entryType === 'General' ? 'General Collection' : values.memberName,
        projectId: values.category === 'Project' && values.projectId !== 'none' ? values.projectId : null,
        date: Timestamp.fromDate(new Date(values.date)),
        updatedAt: serverTimestamp(),
    };

    try {
        if (selectedEntry) {
            await updateDoc(doc(firestore, 'financial_ledger', selectedEntry.id), dataToSave);
            toast({ title: "Entry Updated", description: "The transaction has been adjusted successfully." });
        } else {
            await addDoc(collection(firestore, 'financial_ledger'), {
                ...dataToSave,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Entry Recorded", description: "The financial entry has been logged successfully." });
        }
        setIsDialogOpen(false);
        setSelectedEntry(null);
        form.reset();
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'financial_ledger',
            operation: selectedEntry ? 'update' : 'create',
            requestResourceData: dataToSave
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

  const handleEditClick = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setSelectedEntry(null);
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Parish Treasury</h1>
          <p className="text-muted-foreground font-medium">Record tithes, offertory, and project contributions.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setSelectedEntry(null);
        }}>
            <DialogTrigger asChild>
                <Button onClick={handleAddNewClick} className="font-bold h-12 px-6 rounded-full shadow-lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Record Contribution
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter">
                        {selectedEntry ? 'Adjust Transaction' : 'Contribution Entry'}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedEntry ? 'Modify the details of this recorded entry.' : 'Manually record funds received by the parish office.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField control={form.control} name="entryType" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-xs font-black uppercase opacity-60">Source Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Individual" id="r1" />
                                            <Label htmlFor="r1">Member</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="General" id="r2" />
                                            <Label htmlFor="r2">General Collection</Label>
                                        </div>
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}/>

                        {entryType === 'Individual' && (
                            <FormField control={form.control} name="memberName" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs font-black uppercase">Member Name *</FormLabel><FormControl><Input placeholder="Search or type name..." {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
                            )}/>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs font-black uppercase">Amount (KES) *</FormLabel><FormControl><Input type="number" {...field} className="h-12 font-bold" /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs font-black uppercase">Category</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-12"><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                    <SelectItem value="Tithe">Tithe</SelectItem>
                                    <SelectItem value="Offertory">Offertory</SelectItem>
                                    <SelectItem value="Project">Project Fund</SelectItem>
                                    <SelectItem value="Donation">General Donation</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent></Select></FormItem>
                            )}/>
                        </div>

                        {category === 'Project' && (
                            <FormField control={form.control} name="projectId" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs font-black uppercase">Link to Specific Project</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-12"><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                    <SelectItem value="none">General Development Fund</SelectItem>
                                    {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                                </SelectContent></Select></FormItem>
                            )}/>
                        )}

                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-black uppercase">Date Received</FormLabel><FormControl><Input type="date" {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-black uppercase">Notes / Reference</FormLabel><FormControl><Input placeholder="e.g. M-Pesa ID, Cheque No." {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
                        )}/>

                        <DialogFooter>
                            <Button type="submit" disabled={isSaving} className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl">
                                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <DollarSign className="mr-2 h-5 w-5" />}
                                {selectedEntry ? 'Save Adjustments' : 'Commit to Ledger'}
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
                    Gross Revenue <ArrowUpRight className="h-4 w-4" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-emerald-950">{formatCurrency(totals.total)}</div>
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
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Other Funds</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-950">{formatCurrency(totals.other)}</div>
            </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Registry Transaction History
          </CardTitle>
          <CardDescription>Comprehensive list of all office-recorded contributions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Contributor</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Amount</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse">Syncing Treasury...</TableCell></TableRow>
                ) : financials?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No financial records found in registry.</TableCell></TableRow>
                ) : (
                  (financials || []).map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              {entry.date ? format((entry.date as any).toDate ? (entry.date as any).toDate() : new Date(entry.date as any), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                              {entry.entryType === 'General' ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-primary" />}
                              <div className="flex flex-col">
                                  <span className={cn("font-bold", entry.entryType === 'General' && "text-muted-foreground uppercase text-[10px]")}>{entry.memberName}</span>
                                  {entry.notes && <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{entry.notes}</span>}
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>
                          <Badge variant="outline" className={cn(
                              "font-black text-[10px] uppercase tracking-widest",
                              entry.category === 'Tithe' ? "border-blue-200 text-blue-700 bg-blue-50" :
                              entry.category === 'Offertory' ? "border-purple-200 text-purple-700 bg-purple-50" :
                              entry.category === 'Project' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                              "border-slate-200 text-slate-700 bg-slate-50"
                          )}>
                              {entry.category}
                          </Badge>
                      </TableCell>
                      <TableCell className="font-black text-lg">
                          {formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full" onClick={() => handleEditClick(entry)}>
                                  <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDelete(entry.id)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}