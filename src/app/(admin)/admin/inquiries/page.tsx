'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { Inquiry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Trash2, Eye, Mail, Reply, CheckCircle2, Loader2 } from 'lucide-react';
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
import emailjs from '@emailjs/browser';

export default function AdminInquiriesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const inquiriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inquiries'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: inquiries, isLoading } = useCollection<Inquiry>(inquiriesQuery);

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleView = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsViewOpen(true);
    
    if (inquiry.status === 'unread' && firestore) {
      const docRef = doc(firestore, 'inquiries', inquiry.id);
      await updateDoc(docRef, { status: 'read' });
    }
  };

  const handleReplyClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText('');
    setIsReplyOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyText.trim() || !firestore) return;
    
    setIsSending(true);
    try {
      // Send via EmailJS
      // NOTE: User should replace 'YOUR_PUBLIC_KEY' with their actual EmailJS Public Key in the EmailJS Dashboard
      await emailjs.send(
        'service_02on4rm',
        'template_r2wd65',
        {
          name: selectedInquiry.name,
          email: selectedInquiry.email,
          subject: selectedInquiry.subject,
          message: replyText,
        },
        'YOUR_PUBLIC_KEY' 
      );

      // Update Firestore
      const docRef = doc(firestore, 'inquiries', selectedInquiry.id);
      await updateDoc(docRef, {
        status: 'replied',
        replyMessage: replyText,
        repliedAt: serverTimestamp(),
      });

      toast({ title: 'Reply Sent', description: 'Email dispatched and record updated.' });
      setIsReplyOpen(false);
      setSelectedInquiry(null);
    } catch (error: any) {
      console.error("EmailJS Error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error sending reply', 
        description: error.text || 'EmailJS service error. Check your Public Key configuration.' 
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'inquiries', id));
      toast({ title: 'Inquiry deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread': return <Badge variant="destructive" className="bg-red-600 font-bold uppercase text-[10px]">Unread</Badge>;
      case 'read': return <Badge variant="secondary" className="bg-blue-600 text-white font-bold uppercase text-[10px]">Read</Badge>;
      case 'replied': return <Badge className="bg-green-600 text-white font-bold uppercase text-[10px]">Replied</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Inquiries & Leads</h1>
        <p className="text-muted-foreground font-medium">Manage and respond to messages from the contact form.</p>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Mail className="h-5 w-5 text-primary" />
            Registry Inbox ({inquiries?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Sender</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Subject</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse">Syncing inbox...</TableCell></TableRow>
              ) : inquiries?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No inquiries found in registry.</TableCell></TableRow>
              ) : (
                inquiries?.map((inquiry) => (
                  <TableRow key={inquiry.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs font-bold">
                      {inquiry.createdAt ? format(inquiry.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{inquiry.name}</span>
                        <span className="text-[10px] text-muted-foreground">{inquiry.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate font-medium">
                      {inquiry.subject}
                    </TableCell>
                    <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleView(inquiry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary" onClick={() => handleReplyClick(inquiry)}>
                          <Reply className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Delete Inquiry?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove this inquiry from the registry archive.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(inquiry.id)} className="bg-destructive text-white rounded-full">Delete Record</AlertDialogAction>
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
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Inquiry Details</DialogTitle>
            <DialogDescription>From {selectedInquiry?.name} ({selectedInquiry?.email})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Subject</p>
              <p className="font-bold text-lg">{selectedInquiry?.subject}</p>
            </div>
            <div className="space-y-1 pt-2 border-t border-dashed">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Message Content</p>
              <div className="bg-muted/30 p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                {selectedInquiry?.message}
              </div>
            </div>
            {selectedInquiry?.replyMessage && (
              <div className="space-y-1 pt-4 border-t border-dashed bg-green-50/30 p-4 rounded-2xl border-2 border-green-100">
                <p className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Official Office Reply
                </p>
                <p className="text-sm leading-relaxed italic text-foreground/80">{selectedInquiry.replyMessage}</p>
                <p className="text-[9px] text-muted-foreground mt-2 font-bold uppercase">
                  Dispatched on {selectedInquiry.repliedAt ? format(selectedInquiry.repliedAt.toDate(), 'PPP p') : ''}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)} className="w-full h-12 rounded-full font-bold shadow-md">Close Viewer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Official Response</DialogTitle>
            <DialogDescription>Drafting a reply to {selectedInquiry?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/20 p-4 rounded-2xl border border-dashed">
              <p className="text-[10px] font-black uppercase opacity-50 mb-1">Parishioner Message Reference</p>
              <p className="text-xs italic line-clamp-3">{selectedInquiry?.message}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Your Reply Body</p>
              <Textarea 
                placeholder="Compose your spiritual or administrative response..." 
                className="min-h-[180px] rounded-2xl border-2 focus-visible:ring-primary shadow-sm"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsReplyOpen(false)} className="rounded-full">Discard</Button>
            <Button 
              onClick={handleSendReply} 
              disabled={isSending || !replyText.trim()} 
              className="flex-1 rounded-full h-12 font-black uppercase tracking-widest shadow-xl"
            >
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Reply className="mr-2 h-4 w-4" />}
              Dispatch Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
