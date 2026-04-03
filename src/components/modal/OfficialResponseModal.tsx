"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";
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
      // 1. Send email via EmailJS — appears from St. Martin De Porres
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          name: "St. Martin De Porres Parish",  // ✅ From name
          email: "martindeporres2022@gmail.com", // ✅ From email
          to_email: inquiry.email,               // ✅ To the parishioner
          subject: `Re: ${inquiry.subject}`,
          message: `${replyText}\n\n---\nBlessings,\nAdmin Team\nSt. Martin De Porres Parish\n"In Service to God and Community"`,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      // 2. Update Firestore
      await updateDoc(doc(firestore, "inquiries", inquiry.id), {
        replyMessage: replyText,
        repliedAt: serverTimestamp(),
        status: 'replied'
      });

      toast({ title: "Reply Sent", description: `Response sent to ${inquiry.email}` });
      setReplyText("");
      onClose();
    } catch (error: any) {
      console.error("Reply error:", error);
      toast({ variant: "destructive", title: "Send Failed", description: "Could not send reply. Try again." });
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