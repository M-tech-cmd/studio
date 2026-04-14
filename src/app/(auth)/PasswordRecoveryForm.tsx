"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';

/**
 * Enhanced Password Recovery Form.
 * Handles the "Email Sent" success state locally to prevent premature redirection.
 */
export function PasswordRecoveryForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const { auth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!auth) return;

    setIsLoading(true);

    try {
      // Send password reset email using Firebase
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });

      // Show success screen locally
      setEmailSent(true);
      
      toast({
        title: "Reset Link Sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (err: any) {
      console.error("Password reset error:", err);
      
      let message = 'Failed to send reset link. Please try again.';
      if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email address';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address';
      }

      setError(message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.push('/login');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  // Email Sent Success State
  if (emailSent) {
    return (
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center p-8 bg-green-50/50 border-b border-green-100">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 text-green-600 rounded-full p-4 shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter text-green-900">Reset Email Sent!</CardTitle>
            <CardDescription className="mt-4 text-base font-medium">
              We've sent a secure recovery link to <br/>
              <span className="font-bold text-green-700 block mt-1">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Check your inbox for password reset instructions. The reset link will expire in 1 hour. If you don't see it, check your spam folder.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleBackToSignIn}
                className="w-full h-12 rounded-full font-bold shadow-lg"
              >
                Return to Login
              </Button>
              <Button 
                onClick={handleBackToHome}
                variant="ghost"
                className="w-full h-12 rounded-full font-bold"
              >
                Back to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initial Request Form
  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center p-8 bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">Recover Access</CardTitle>
          <CardDescription className="mt-2 font-medium">
            Enter your email and we'll send you a secure link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest opacity-60">Registered Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 pl-10 border-2 rounded-xl focus-visible:ring-primary"
                />
              </div>
              {error && (
                <p className="text-xs font-bold text-destructive animate-in slide-in-from-top-1">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Requesting Link...
                </>
              ) : (
                'Send Recovery Link'
              )}
            </Button>

            <Button
              type="button"
              onClick={handleBackToSignIn}
              variant="outline"
              className="w-full h-12 rounded-full font-bold border-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
