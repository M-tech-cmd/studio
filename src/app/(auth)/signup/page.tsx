'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { auth, user, isUserLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    if (!auth || !firestore) return;
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);

      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        name: user.email?.split('@')[0] || 'New User',
        photoURL: user.photoURL || null,
        role: 'user',
        isAdmin: false,
        dateJoined: serverTimestamp(),
        status: 'Offline',
        lastSeen: serverTimestamp(),
      });

      toast({
        title: 'Account Created',
        description: "Welcome! Please sign in to continue.",
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  }

  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card className="mx-auto max-w-md w-full shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
            <Logo url={settings?.logoUrl} className="h-20 w-20" />
        </div>
        <Button asChild variant="ghost" className="w-fit p-0 h-auto absolute top-6 left-6">
            <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
            </Link>
        </Button>
        <CardTitle className="text-3xl font-black tracking-tight uppercase pt-12">St. Martin De Porres Portal</CardTitle>
        <CardDescription>Create your member account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="you@example.com" {...field} className="pl-10 h-12" />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" {...field} className="pl-10 pr-10 h-12"/>
                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                             {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" {...field} className="pl-10 pr-10 h-12"/>
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                             {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" className="w-full h-12 font-bold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
            </Button>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
