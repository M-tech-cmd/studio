'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, User as FirebaseUser, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithRedirect, getRedirectResult, updateProfile } from 'firebase/auth';
import { Database } from 'firebase/database';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { useToast } from '@/hooks/use-toast';

// Define the method type
export type AuthMethod = 'google' | 'email' | null;

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
  storage?: any;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  database: Database | null;
  user: User | null;
  isUserLoading: boolean;
  isRedirecting: boolean;
  userError: Error | null;
  isSigningIn: boolean;
  signingInMethod: AuthMethod;
  setSigningInMethod: (method: AuthMethod) => void;
  startGoogleSignIn: () => Promise<void>;
}

export interface FirebaseServicesAndUser extends FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

async function upsertUserProfile(firestore: Firestore, user: FirebaseUser) {
    if (!firestore || !user) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        const userDocSnap = await getDoc(userDocRef);
        const name = user.displayName || (user.email ? user.email.split('@')[0] : 'New User');

        if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
                id: user.uid,
                email: user.email,
                name: name,
                photoURL: user.photoURL || null,
                role: 'user',
                isAdmin: false,
                dateJoined: serverTimestamp(),
                status: 'Offline',
                lastSeen: serverTimestamp(),
            }, { merge: true });
        } else {
            // For existing users, ensure display data is synced (especially for Google logins)
            const updateData: any = {
                email: user.email,
                photoURL: user.photoURL || null,
            };
            // Only overwrite name if display name exists (prevents losing email signup name)
            if (user.displayName) {
                updateData.name = user.displayName;
            }
            await setDoc(userDocRef, updateData, { merge: true });
        }
    } catch (err) {
        console.error("Auth Listener: Error upserting user profile:", err);
    }
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  database,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signingInMethod, setSigningInMethod] = useState<AuthMethod>(null);
  const isAuthListenerInitialized = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (auth) {
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.error("Auth: Persistence error:", err);
      });

      getRedirectResult(auth).then((result) => {
        if (result?.user) {
          toast({ title: "Welcome back!", description: `Signed in as ${result.user.displayName || result.user.email}` });
        }
        setIsRedirecting(false);
        setSigningInMethod(null);
      }).catch((error) => {
        setIsRedirecting(false);
        setSigningInMethod(null);
        if (error.code !== 'auth/no-auth-event') {
            console.error("Auth: Redirect sync error:", error);
            toast({ variant: 'destructive', title: 'Auth Error', description: 'Could not complete redirect. Try again.' });
        }
      });
    }
  }, [auth, toast]);

  useEffect(() => {
    if (!auth) { 
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    if (!isAuthListenerInitialized.current) {
        isAuthListenerInitialized.current = true;

        const unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            if (firebaseUser) {
              await upsertUserProfile(firestore, firebaseUser);
            }
            
            setUserAuthState({ 
              user: firebaseUser, 
              isUserLoading: false, 
              userError: null 
            });
          },
          (error) => {
            console.error("Auth Listener: onAuthStateChanged error:", error);
            setUserAuthState({ user: null, isUserLoading: false, userError: error });
          }
        );
        return () => {
            unsubscribe();
        };
    }
  }, [auth, firestore]);

  const startGoogleSignIn = async () => {
    if (isSigningIn || signingInMethod || !auth) return;

    setSigningInMethod('google');
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
        await signInWithRedirect(auth, provider);
    } catch (error: any) {
        console.error("Auth: Sign-in error:", error.code, error.message);
        toast({ variant: 'destructive', title: 'Sign-In Failed', description: error.message });
        setIsSigningIn(false);
        setSigningInMethod(null);
    }
  };

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && database);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      database: servicesAvailable ? database : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      isRedirecting,
      userError: userAuthState.userError,
      isSigningIn,
      signingInMethod,
      setSigningInMethod,
      startGoogleSignIn
    };
  }, [firebaseApp, firestore, auth, database, userAuthState, isSigningIn, isRedirecting, signingInMethod]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.database) {
    throw new Error('Firebase core services not available.');
  }
  return {
    ...context,
    firebaseApp: context.firebaseApp!,
    firestore: context.firestore!,
    auth: context.auth!,
    database: context.database!,
  };
};

export const useAuth = () => {
  const { auth, user, isUserLoading, isRedirecting, userError, isSigningIn, signingInMethod, setSigningInMethod, startGoogleSignIn } = useFirebase();
  return { auth, user, isUserLoading, isRedirecting, userError, isSigningIn, signingInMethod, setSigningInMethod, startGoogleSignIn };
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useStorage = (): any => {
  return null;
};

export const useDatabase = (): Database => {
    const { database } = useFirebase();
    return database;
}

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
