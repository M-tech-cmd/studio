'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, User as FirebaseUser, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { Database } from 'firebase/database';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { useToast } from '@/hooks/use-toast';

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
            const updateData = {
                email: user.email,
                name: name,
                photoURL: user.photoURL || null,
            };
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
  const isAuthListenerInitialized = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (auth) {
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.error("Auth: Persistence error:", err);
      });

      getRedirectResult(auth).then((result) => {
        if (result?.user) {
          toast({ title: "Authorized", description: "Identity verified via Google." });
        }
        setIsRedirecting(false);
      }).catch((error) => {
        setIsRedirecting(false);
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
    if (isSigningIn || !auth) return;

    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
        await signInWithRedirect(auth, provider);
    } catch (error: any) {
        console.error("Auth: Sign-in error:", error.code, error.message);
        toast({ variant: 'destructive', title: 'Sign-In Failed', description: error.message });
        setIsSigningIn(false);
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
      startGoogleSignIn
    };
  }, [firebaseApp, firestore, auth, database, userAuthState, isSigningIn, isRedirecting]);

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
  const { auth, user, isUserLoading, isRedirecting, userError, isSigningIn, startGoogleSignIn } = useFirebase();
  return { auth, user, isUserLoading, isRedirecting, userError, isSigningIn, startGoogleSignIn };
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
