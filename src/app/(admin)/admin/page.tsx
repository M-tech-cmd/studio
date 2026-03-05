'use client';

import Link from 'next/link';
import { Shield, Calendar, Users, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const quickLinks = [
  { label: 'Events', icon: Calendar },
  { label: 'Profiles', icon: Users },
  { label: 'Documents', icon: FileText },
  { label: 'Settings', icon: Settings },
];

export default function AdminAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary text-primary-foreground rounded-full p-4">
              <Shield className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Admin Access</h1>
          <p className="text-muted-foreground mb-8">
            Church Administration Portal
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-center">
            {quickLinks.map((link) => (
              <Card key={link.label} className="p-4 flex flex-col items-center justify-center gap-2 bg-background hover:bg-accent transition-colors">
                <link.icon className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{link.label}</span>
              </Card>
            ))}
          </div>

          <Button asChild size="lg" className="w-full">
            <Link href="/admin/dashboard">Enter Admin Dashboard</Link>
          </Button>

          <p className="text-xs text-muted-foreground mt-4 max-w-xs mx-auto">
            This area is restricted to authorized church administrators only. A valid passkey is required to access administrative functions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
