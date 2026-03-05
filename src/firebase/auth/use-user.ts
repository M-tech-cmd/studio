'use client';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useUser as useUserFromProvider, useAuth as useAuthInstanceFromProvider } from '@/firebase';

// This is the main hook to get user auth state.
export { useUser } from '@/firebase';

// This composed hook is for convenience, providing the auth instance, user state, and a sign-out function.
export function useAuth() {
  const auth = useAuthInstanceFromProvider();
  const { isUserLoading, user } = useUserFromProvider();

  const signOut = () => firebaseSignOut(auth);

  return {
    isUserLoading,
    user,
    auth,
    signOut
  }
}
