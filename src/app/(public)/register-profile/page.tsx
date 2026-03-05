
'use client';
import { PageHeader } from '@/components/shared/PageHeader';
import { MemberProfileForm } from '@/components/forms/MemberProfileForm';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterProfilePage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p>Loading...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div>
                <PageHeader title="Access Denied" subtitle="You must be logged in to create or edit a member profile." />
                <div className="container max-w-lg mx-auto py-16 text-center">
                    <Card>
                        <CardHeader>
                            <CardTitle>Please Sign In</CardTitle>
                            <CardDescription>To access the member profile registration, you need to be signed into your account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button asChild>
                                <Link href="/login">Go to Login</Link>
                             </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }


    return (
        <div>
            <PageHeader title="Member Profile" subtitle="Complete your professional and church life profile." />
            <section className="py-16">
                <div className="container max-w-4xl mx-auto px-4">
                    <MemberProfileForm />
                </div>
            </section>
        </div>
    );
}
