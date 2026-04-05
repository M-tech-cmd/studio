"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function OfficialResponseModal({ isOpen, onClose, inquiry }: any) {
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDispatch = async () => {
    if (!replyText.trim()) {
      toast({ variant: "destructive", title: "Empty Reply", description: "Please type a response." });
      return;
    }
    setLoading(true);

    try {
      // 1. Dispatch via Resend API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inquiry.email,
          subject: `Re: ${inquiry.subject}`,
          html: `
            <div style="font-family: sans-serif; color: #1e3a5f; padding: 20px;">
              <p>${replyText}</p>
              <br/>
              <p>Blessings,<br/>
              Admin Team<br/>
              <strong>St. Martin De Porres Parish</strong></p>
            </div>
          `
        })
      });

      if (!response.ok) throw new Error('Email dispatch failed');

      // 2. Update Firestore Registry
      await updateDoc(doc(firestore, "inquiries", inquiry.id), {
        replyMessage: replyText,
        repliedAt: serverTimestamp(),
        status: 'replied'
      });

      toast({ title: "Reply Sent", description: `Response dispatched to ${inquiry.email}` });
      setReplyText("");
      onClose();
    } catch (error: any) {
      console.error("Reply error:", error);
      toast({ variant: "destructive", title: "Send Failed", description: "Could not send reply via Resend API. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl italic font-bold text-primary">Official Response</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Replying to <strong>{inquiry.name}</strong> ({inquiry.email})
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
            <p className="text-sm font-medium mb-3">{inquiry.subject}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Their Message</p>
            <p className="text-sm italic text-slate-700">"{inquiry.message}"</p>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Your Reply</Label>
            <Textarea
              placeholder="Provide a helpful and blessed response..."
              className="min-h-[200px] resize-none"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Discard</Button>
          <Button
            onClick={handleDispatch}
            disabled={loading}
            className="flex-1 font-bold"
          >
            {loading ? "Sending..." : "Dispatch Response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}