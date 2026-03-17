'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const resetSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

type View = 'login' | 'reset';

export default function LoginPage() {
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<View>('login');
  const router = useRouter();
  const { user, isUserLoading, auth, startGoogleSignIn, isSigningIn } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    if (!auth) return;
    setFormLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, values.email, values.password);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.code === 'auth/invalid-credential' ? 'Incorrect email or password.' : (error.message || 'An error occurred.'),
      });
    } finally {
      setFormLoading(false);
    }
  }

  async function onResetSubmit(values: z.infer<typeof resetSchema>) {
    if (!auth) return;
    setFormLoading(true);
    try {
        await sendPasswordResetEmail(auth, values.email);
        toast({
            title: 'Reset Email Sent',
            description: 'Check your inbox for instructions.',
        });
        setView('login');
        resetForm.reset();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Reset Failed',
            description: error.message || 'Could not send reset email.',
        });
    } finally {
        setFormLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    await startGoogleSignIn();
  };
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });
  
  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (view === 'reset') {
    return (
        <Card className="mx-auto max-w-md w-full shadow-2xl">
            <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                    <Logo url={settings?.logoUrl} className="h-20 w-20" />
                </div>
                <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...resetForm}>
                    <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                        <FormField
                            control={resetForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="you@example.com" {...field} className="pl-10" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={formLoading}>
                            {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                    </form>
                </Form>
                 <Button variant="link" onClick={() => setView('login')} className="mt-4 w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-md w-full shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
            <Logo url={settings?.logoUrl} className="h-20 w-20" />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight uppercase">St. Martin De Porres Portal</CardTitle>
        <CardDescription>Sign in to your member account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button variant="outline" className="w-full h-12 font-bold" onClick={handleGoogleSignIn} disabled={formLoading || isSigningIn}>
            {formLoading || isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-2" />}
            Continue with Google
          </Button>

          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">OR</span></div></div>

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
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
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} className="pl-10 pr-10 h-12"/>
                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                             {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 font-bold" disabled={formLoading || isSigningIn}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>

           <div className="mt-6 text-center text-sm flex justify-between">
            <Button variant="link" className="p-0 h-auto" onClick={() => setView('reset')}>Forgot password?</Button>
            <Button variant="link" asChild className="p-0 h-auto font-bold"><Link href="/signup">Create Account</Link></Button>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
