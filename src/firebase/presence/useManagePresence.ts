
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

/**
 * A Firestore-based presence management hook that uses the Page Visibility API.
 *
 * How it works:
 * 1. On login or when the hook mounts with a user, it immediately sets the user's status to 'Online' in their Firestore document.
 * 2. It listens for the browser tab's 'visibilitychange' event.
 * 3. When the tab becomes hidden (user switches tabs, minimizes), it sets the status to 'Offline'.
 * 4. When the tab becomes visible again, it sets the status back to 'Online'.
 * 5. On cleanup (logout/unmount), it sets the status to 'Offline'.
 */
export function useManagePresence() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Exit if the user is not logged in or Firestore is not available.
    if (!user || !firestore) {
      return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);

    // Set user online immediately on component mount if the page is visible.
    if (document.visibilityState === 'visible') {
        updateDoc(userDocRef, {
            status: 'Online',
            lastSeen: serverTimestamp(),
        });
    }

    const handleVisibilityChange = () => {
      // If the user brings the tab back into view, set them to 'Online'.
      if (document.visibilityState === 'visible') {
        updateDoc(userDocRef, {
          status: 'Online',
          lastSeen: serverTimestamp(),
        });
      } else {
        // If the user switches away from the tab, set them to 'Offline'.
        updateDoc(userDocRef, {
          status: 'Offline',
          lastSeen: serverTimestamp(),
        });
      }
    };
    
    // Add the event listener for tab visibility changes.
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // The cleanup function runs when the component unmounts (e.g., user logs out).
    return () => {
      // Set user to 'Offline' one last time on cleanup.
      updateDoc(userDocRef, {
        status: 'Offline',
        lastSeen: serverTimestamp(),
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, firestore]);
}
