'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redundant page - Consolidated into /admin/branding.
 * Redirecting to prevent 404s while enforcing new structure.
 */
export default function DeletedThemePage() {
    useEffect(() => {
        redirect('/admin/branding');
    }, []);
    return null;
}
