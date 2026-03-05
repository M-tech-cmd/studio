'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Unified History Route.
 * Redirects to the /about page which contains the 'Our History' section.
 */
export default function HistoryRedirect() {
    useEffect(() => {
        redirect('/about');
    }, []);
    return null;
}