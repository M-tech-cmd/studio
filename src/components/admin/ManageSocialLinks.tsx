'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, ExternalLink, Globe, Loader2, Eye, EyeOff } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { SocialLink } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * ManageSocialLinks: Registry-driven Social Media Management.
 * Synchronized with the 'social_links' collection for public site display.
 */
export function ManageSocialLinks() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [links, setLinks] = React.useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch all social links WITHOUT composite index
  React.useEffect(() => {
    if (!firestore) return;

    const fetchLinks = async () => {
      setIsLoading(true);
      try {
        // Fetch ALL documents (no where/orderBy - no index needed)
        const snapshot = await getDocs(collection(firestore, 'social_links'));
        
        // Filter and sort in JavaScript
        const fetchedLinks = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as SocialLink))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        setLinks(fetchedLinks);
      } catch (error) {
        console.error('Error fetching social links:', error);
        toast({ variant: 'destructive', title: 'Error loading social links' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, [firestore]);

  const [dialogOpen, setDialogOpen] = useState(false);
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
        toast({ title: 'Registry Synchronized', description: `${form.platform} link updated.` });
      } else {
        await addDoc(collection(firestore, 'social_links'), form);
        toast({ title: 'New Platform Added', description: `${form.platform} is now in the registry.` });
      }
      setDialogOpen(false);

      // Refresh list
      const snapshot = await getDocs(collection(firestore, 'social_links'));
      const fetchedLinks = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as SocialLink))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setLinks(fetchedLinks);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'social_links',
        operation: selected ? 'update' : 'create',
        requestResourceData: form
      }));
      toast({ variant: 'destructive', title: 'Registry Sync Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'social_links', id));
      toast({ title: 'Link Removed', description: `Platform has been deleted from registry.` });

      // Refresh list
      const snapshot = await getDocs(collection(firestore, 'social_links'));
      const fetchedLinks = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as SocialLink))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setLinks(fetchedLinks);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `social_links/${id}`,
        operation: 'delete',
      }));
      toast({ variant: 'destructive', title: 'Deletion Blocked' });
    }
  };

  const handleToggleActive = async (item: SocialLink) => {
    if (!firestore) return;
    const updatedData = { is_active: !item.is_active };
    try {
      await updateDoc(doc(firestore, 'social_links', item.id), updatedData);
      toast({ title: updatedData.is_active ? 'Platform Online' : 'Platform Hidden' });

      // Refresh list
      const snapshot = await getDocs(collection(firestore, 'social_links'));
      const fetchedLinks = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as SocialLink))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setLinks(fetchedLinks);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `social_links/${item.id}`,
        operation: 'update',
        requestResourceData: updatedData
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Social Media Registry</h1>
          <p className="text-muted-foreground font-medium">Manage icons and platform links displayed across the public site.</p>
        </div>
        <Button onClick={openNew} className="rounded-full font-black h-12 px-8 shadow-lg transition-all active:scale-95">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Platform
        </Button>
      </div>

      <div className="bg-card border-none shadow-xl rounded-[2rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-black uppercase text-[10px] p-6 tracking-widest opacity-60">Platform</TableHead>
              <TableHead className="font-black uppercase text-[10px] p-6 tracking-widest opacity-60">Destination URL</TableHead>
              <TableHead className="font-black uppercase text-[10px] p-6 tracking-widest opacity-60">Order</TableHead>
              <TableHead className="font-black uppercase text-[10px] p-6 tracking-widest opacity-60">Status</TableHead>
              <TableHead className="text-right font-black uppercase text-[10px] p-6 tracking-widest opacity-60">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24">
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground opacity-50">Syncing Registry...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !links || links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24 text-muted-foreground italic">
                  <div className="flex flex-col items-center gap-4">
                    <Globe className="h-12 w-12 opacity-10" />
                    <p className="font-medium">No social platforms have been registered yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              links.map((item) => (
                <TableRow key={item.id} className="group hover:bg-primary/5 transition-colors">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5 shadow-inner transition-transform group-hover:scale-110">
                        <Globe className="h-6 w-6" />
                      </div>
                      <span className="font-black text-xl tracking-tighter">{item.platform}</span>
                    </div>
                  </TableCell>
                  <TableCell className="p-6">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 font-bold group/link"
                    >
                      <span className="truncate max-w-[200px]">{item.url}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  </TableCell>
                  <TableCell className="p-6">
                    <Badge variant="outline" className="font-mono text-xs font-black border-2">{item.sort_order}</Badge>
                  </TableCell>
                  <TableCell className="p-6">
                    <button 
                      onClick={() => handleToggleActive(item)}
                      className="transition-transform active:scale-90"
                    >
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-black text-[9px] uppercase px-4 py-1 cursor-pointer transition-all border shadow-sm",
                          item.is_active !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        {item.is_active !== false ? (
                            <span className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> ONLINE</span>
                        ) : (
                            <span className="flex items-center gap-1.5"><EyeOff className="h-3 w-3" /> HIDDEN</span>
                        )}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="p-6 text-right">
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full h-10 w-10 border-2 transition-all hover:border-primary hover:text-primary"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                              variant="outline" 
                              size="icon" 
                              className="rounded-full h-10 w-10 border-2 text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Remove platform?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove <strong>{item.platform}</strong> from the public site links.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Abort</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(item.id)} 
                              className="bg-destructive text-white rounded-full font-black uppercase tracking-widest"
                            >
                              Execute Purge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-primary/5 border-b">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
              {selected ? 'Modify Entry' : 'New Platform'}
            </DialogTitle>
            <DialogDescription className="font-medium">Define platform routing and display hierarchy.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Platform Label</Label>
              <Input 
                value={form.platform} 
                onChange={(e) => setForm({ ...form, platform: e.target.value })} 
                placeholder="e.g. YouTube, Instagram..." 
                className="h-12 border-2 rounded-xl text-lg font-bold" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Full Redirect URL</Label>
              <Input 
                value={form.url} 
                onChange={(e) => setForm({ ...form, url: e.target.value })} 
                placeholder="https://..." 
                className="h-12 border-2 rounded-xl font-mono text-sm" 
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Display Order</Label>
                <Input 
                  type="number" 
                  value={form.sort_order} 
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} 
                  className="h-12 border-2 rounded-xl font-bold" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Visibility</Label>
                <div className="flex items-center h-12 gap-3 px-4 border-2 rounded-xl bg-muted/5">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={form.is_active} 
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-5 w-5 rounded border-primary accent-primary cursor-pointer"
                  />
                  <Label htmlFor="is_active" className="font-black text-xs uppercase cursor-pointer">Live</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/5 border-t">
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
            >
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {selected ? 'Commit Adjustments' : 'Commit to Registry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}