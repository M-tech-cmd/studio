'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, ExternalLink, Globe, Loader2 } from 'lucide-react';
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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { SocialLink } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ManageSocialLinks() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const socialLinksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'social_links'), orderBy('sort_order', 'asc'));
  }, [firestore]);

  const { data: links, isLoading } = useCollection<SocialLink>(socialLinksQuery);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<SocialLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform: '',
    url: '',
    icon_name: '',
    sort_order: 0,
    is_active: true,
  });

  const openNew = () => {
    setSelected(null);
    setForm({
      platform: '',
      url: '',
      icon_name: '',
      sort_order: (links?.length || 0) + 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: SocialLink) => {
    setSelected(item);
    setForm({
      platform: item.platform,
      url: item.url,
      icon_name: item.icon_name || '',
      sort_order: item.sort_order || 0,
      is_active: item.is_active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!firestore) return;
    if (!form.platform.trim() || !form.url.trim()) {
      toast({ variant: 'destructive', title: 'Platform and URL are required' });
      return;
    }

    setSaving(true);
    try {
      if (selected) {
        const linkDoc = doc(firestore, 'social_links', selected.id);
        await updateDoc(linkDoc, form);
        toast({ title: 'Social link updated' });
      } else {
        await addDoc(collection(firestore, 'social_links'), form);
        toast({ title: 'Social link added' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'social_links',
        operation: selected ? 'update' : 'create',
        requestResourceData: form
      }));
      toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !selected) return;
    try {
      await deleteDoc(doc(firestore, 'social_links', selected.id));
      toast({ title: 'Link deleted' });
      setDeleteOpen(false);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `social_links/${selected.id}`,
        operation: 'delete',
      }));
      toast({ variant: 'destructive', title: 'Failed to delete' });
    }
  };

  const handleToggleActive = async (item: SocialLink) => {
    if (!firestore) return;
    const updatedData = { is_active: !item.is_active };
    try {
      await updateDoc(doc(firestore, 'social_links', item.id), updatedData);
      toast({ title: updatedData.is_active ? 'Link enabled' : 'Link hidden' });
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `social_links/${item.id}`,
        operation: 'update',
        requestResourceData: updatedData
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Social Media Links</h1>
          <p className="text-muted-foreground font-medium">Manage icons and platform links for the church website.</p>
        </div>
        <Button onClick={openNew} className="rounded-full font-bold h-12 px-6 shadow-lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Social Link
        </Button>
      </div>

      <div className="bg-card border-none shadow-xl rounded-3xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-black uppercase text-[10px] p-6">Platform</TableHead>
              <TableHead className="font-black uppercase text-[10px] p-6">URL</TableHead>
              <TableHead className="font-black uppercase text-[10px] p-6">Order</TableHead>
              <TableHead className="font-black uppercase text-[10px] p-6">Status</TableHead>
              <TableHead className="text-right font-black uppercase text-[10px] p-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2 animate-pulse">
                    <Globe className="h-8 w-8 text-primary/20" />
                    <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Synchronizing Archive...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !links || links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                  No social links registered in the registry.
                </TableCell>
              </TableRow>
            ) : (
              links.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/30">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                        <Globe className="h-5 w-5" />
                      </div>
                      <span className="font-black text-lg tracking-tight">{item.platform}</span>
                    </div>
                  </TableCell>
                  <TableCell className="p-6">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      {item.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="p-6">
                    <Badge variant="outline" className="font-mono">{item.sort_order}</Badge>
                  </TableCell>
                  <TableCell className="p-6">
                    <button 
                      onClick={() => handleToggleActive(item)}
                      className="transition-transform active:scale-95"
                    >
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-black text-[10px] uppercase px-3 py-1 cursor-pointer transition-colors",
                          item.is_active !== false ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {item.is_active !== false ? "Active" : "Hidden"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full h-10 w-10 border-2"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full h-10 w-10 border-2 text-destructive hover:bg-destructive/10"
                        onClick={() => { setSelected(item); setDeleteOpen(true); }}
                      >
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
              {selected ? 'Modify Link' : 'Register Link'}
            </DialogTitle>
            <DialogDescription>Enter platform details for the public directory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase opacity-60">Platform Name</Label>
              <Input 
                value={form.platform} 
                onChange={(e) => setForm({ ...form, platform: e.target.value })} 
                placeholder="Facebook, Instagram, etc." 
                className="h-12 border-2 rounded-xl" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase opacity-60">Redirect URL</Label>
              <Input 
                value={form.url} 
                onChange={(e) => setForm({ ...form, url: e.target.value })} 
                placeholder="https://..." 
                className="h-12 border-2 rounded-xl font-mono text-sm" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase opacity-60">Display Order</Label>
                <Input 
                  type="number" 
                  value={form.sort_order} 
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} 
                  className="h-12 border-2 rounded-xl" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase opacity-60">Visibility</Label>
                <div className="flex items-center h-12 gap-2 px-4 border-2 rounded-xl bg-muted/10">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={form.is_active} 
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-5 w-5 rounded border-primary accent-primary"
                  />
                  <Label htmlFor="is_active" className="font-bold cursor-pointer">Live on Website</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl"
            >
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {selected ? 'Commit Adjustments' : 'Add to Directory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Registry Purge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the <strong>{selected?.platform}</strong> link? This action is final.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Abort</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-white rounded-full font-bold"
            >
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
