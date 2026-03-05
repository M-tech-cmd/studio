'use client';

import { useUser } from '@/firebase';
import React from 'react';

type AuthAwareDataProps = {
  children: React.ReactNode;
  loadingComponent: React.ReactNode;
};

/**
 * A client component wrapper that checks for the Firebase user authentication state.
 * It shows a loading component until the user's auth state is resolved,
 * and only then renders its children. This prevents child components
 * from making unauthorized Firestore requests before auth is ready.
 */
export function AuthAwareData({ children, loadingComponent }: AuthAwareDataProps) {
  const { isUserLoading } = useUser();

  if (isUserLoading) {
    return <>{loadingComponent}</>;
  }

  // Only render children when authentication is no longer loading.
  return <>{children}</>;
}
