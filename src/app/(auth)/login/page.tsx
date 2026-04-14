'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import {
  signInWithEmailAndPassword,
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
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  const { 
    user, 
    isUserLoading, 
    auth, 
    startGoogleSignIn, 
    isSigningIn, 
    signingInMethod, 
    setSigningInMethod 
  } = useAuth();
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      toast({ title: `Welcome back!`, description: `Signed in as ${user.displayName || user.email}` });
      router.replace('/');
    }
  }, [user, isUserLoading, router, toast]);

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    if (!auth) return;
    
    setSigningInMethod('email');
    setFormLoading(true);
    
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, values.email, values.password);
    } catch (error: any) {
      setSigningInMethod(null);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.code === 'auth/invalid-credential' ? 'Incorrect email or password.' : (error.message || 'An error occurred.'),
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

  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card className="mx-auto max-w-md w-full shadow-2xl border-none rounded-3xl overflow-hidden">
      <CardHeader className="text-center space-y-4 p-8 bg-primary/5 border-b border-primary/10">
        <div className="flex justify-center">
            <Logo url={settings?.logoUrl} className="h-20 w-20" />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight uppercase">St. Martin De Porres</CardTitle>
        <CardDescription className="font-medium">Sign in to your member account</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full h-12 font-bold rounded-xl border-2 hover:bg-muted/50" 
            onClick={handleGoogleSignIn} 
            disabled={formLoading || isSigningIn}
          >
            {signingInMethod === 'google' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <div className="mr-2 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34a853"/>
                  <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957a8.991 8.991 0 0 0 0 8.088l3.007-2.332z" fill="#fbbc05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#ea4335"/>
                </svg>
              </div>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground font-black tracking-widest">OR</span></div>
          </div>

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest opacity-60">Email</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="you@example.com" {...field} className="pl-10 h-12 rounded-xl border-2" />
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
                    <div className="flex justify-between items-center">
                        <FormLabel className="text-xs font-black uppercase tracking-widest opacity-60">Password</FormLabel>
                        <Link href="/recover-password" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
                    </div>
                    <FormControl>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} className="pl-10 pr-10 h-12 rounded-xl border-2"/>
                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                             {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-14 font-black uppercase tracking-widest rounded-full shadow-xl transition-all active:scale-95" disabled={formLoading || isSigningIn}>
                {signingInMethod === 'email' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

           <div className="mt-6 text-center text-sm border-t pt-6">
            <p className="text-muted-foreground">Don't have an account?</p>
            <Button variant="link" asChild className="p-0 h-auto font-black uppercase tracking-widest text-primary mt-1">
                <Link href="/signup">Create Member Account</Link>
            </Button>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
