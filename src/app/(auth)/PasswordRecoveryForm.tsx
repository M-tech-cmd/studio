"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();

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
        url: `${window.location.origin}/auth/sign-in`,
        handleCodeInApp: true,
      });

      setEmailSent(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (err: any) {
      console.error("Password reset error:", err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else {
        setError('Failed to send reset link. Please try again.');
      }

      toast({
        variant: 'destructive',
        title: 'Error',
        description: error || 'Failed to send reset link',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.push('/auth/sign-in');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  // Email Sent State
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 text-green-600 rounded-full p-3">
                <Mail className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">Reset Email Sent!</CardTitle>
            <CardDescription className="mt-2">
              Check your inbox at <span className="font-semibold text-foreground">{email}</span> for instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The reset link will expire in 1 hour. If you don't see the email, check your spam folder.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={handleBackToSignIn}
                className="w-full"
              >
                Return to Login
              </Button>
              <Button 
                onClick={handleBackToHome}
                variant="outline"
                className="w-full"
              >
                Back to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password Recovery Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Recover Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a recovery link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Registered Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="kimaniemma20@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Button
              type="button"
              onClick={handleBackToSignIn}
              variant="outline"
              className="w-full h-11"
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