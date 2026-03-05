'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Legacy redundant settings page. 
 * Consolidated all functionality into /admin/branding.
 */
export default function LegacySettingsRedirect() {
    useEffect(() => {
        redirect('/admin/branding');
    }, []);
    return null;
}
