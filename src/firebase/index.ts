'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentIndexedDbWebProvider,
  Firestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  
  if (!getApps().length) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      firebaseApp = getApp();
    }
  } else {
    firebaseApp = getApp();
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  let firestore: Firestore;
  
  try {
    // Modern persistent cache implementation
    firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentIndexedDbWebProvider()
      })
    });
  } catch (e) {
    firestore = getFirestore(firebaseApp);
  }

  const storage = getStorage(firebaseApp, "studio-8930156154-19ec3.firebasestorage.app");
  console.log("[Firebase] Storage verified with bucket:", storage.app.options.storageBucket);

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
    storage,
    database: getDatabase(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
