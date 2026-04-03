"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { format } from "date-fns";
import { Mail, Eye, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfficialResponseModal } from "@/components/modal/OfficialResponseModal";
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
} from "@/components/ui/alert-dialog";

export default function InquiriesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const memoizedQuery = useMemoFirebase(
    () => query(collection(firestore, "inquiries"), orderBy("createdAt", "desc")),
    [firestore]
  );

  const { data: inquiries, isLoading } = useCollection(memoizedQuery);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = async (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setIsModalOpen(true);
    if (inquiry.status === 'unread') {
      try {
        await updateDoc(doc(firestore, "inquiries", inquiry.id), { status: 'read' });
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "inquiries", id));
      toast({ title: "Inquiry Deleted", description: "The message has been removed." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete the inquiry." });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold italic">Registry Inbox</h1>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Inquiries & Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!inquiries || inquiries.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      The inbox is empty.
                    </TableCell>
                  </TableRow>
                )}
                {inquiries?.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-sm text-muted-foreground">
                      {item.createdAt?.seconds
                        ? format(item.createdAt.toDate(), "MMM dd, p")
                        : "Just now"}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{item.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">{item.email}</div>
                    </TableCell>
                    <TableCell>{item.subject}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'unread' ? 'destructive' :
                          item.status === 'replied' ? 'default' : 'outline'
                        }
                        className={item.status === 'replied' ? 'bg-green-600 text-white' : ''}
                      >
                        {item.status?.toUpperCase() || 'NEW'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove message from <strong>{item.name}</strong>? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedInquiry && (
        <OfficialResponseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          inquiry={selectedInquiry}
        />
      )}
    </div>
  );
}