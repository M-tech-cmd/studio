'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redundant page - Consolidated into /admin/branding and /admin/contact.
 * Redirecting to enforce the new administrative navigation.
 */
export default function DeletedSettingsPage() {
    useEffect(() => {
        redirect('/admin/branding');
    }, []);
    return null;
}
