"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function PasskeyModal() {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  // Get passkey from environment variable
  const ADMIN_PASSKEY = process.env.NEXT_PUBLIC_ADMIN_PASSKEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (passkey === ADMIN_PASSKEY) {
       if (user && firestore) {
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          await updateDoc(userDocRef, { isAdmin: true, role: 'admin' });
          toast({ title: "Admin Role Granted", description: "Your role has been updated to Administrator." });
        } catch (err: any) {
          console.error("Error granting admin role:", err);
          toast({ variant: 'destructive', title: 'Error Updating Role', description: 'Could not update your role to admin.'});
        }
      }
    } else {
      setError('Invalid passkey. Please try again.');
    }
  };

  const handleCancel = () => {
    router.push('/');
  }

  return (
    <Dialog open={true} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <div className="flex justify-center mb-4">
                <div className="bg-secondary text-secondary-foreground rounded-full p-3">
                <KeyRound className="h-8 w-8" />
                </div>
            </div>
          <DialogTitle className="text-center">Admin Access Required</DialogTitle>
          <DialogDescription className="text-center">
            Please enter the 6-digit passkey to access the admin portal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="passkey" className="sr-only">
                Passkey
              </Label>
              <Input
                id="passkey"
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="col-span-3 text-center text-2xl tracking-[1em]"
                maxLength={6}
                placeholder="••••••"
              />
            </div>
            {error && <p className="col-span-4 text-center text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={handleCancel}>Return to Homepage</Button>
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}