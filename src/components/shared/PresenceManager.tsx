'use client';
import { useManagePresence } from '@/firebase/presence/useManagePresence';

// This component's sole purpose is to activate the presence management hook.
// It renders nothing and should be placed in a layout component that is
// always present for logged-in users.
export function PresenceManager() {
    useManagePresence();
    return null;
}
