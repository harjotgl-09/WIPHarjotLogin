'use client';

import { ReactNode, useEffect, useState } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

import { initializeFirebase, FirebaseProvider } from '@/firebase';

type FirebaseClientProviderProps = {
  children: ReactNode;
};

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    // This check ensures that initializeFirebase is called only once.
    if (!firebase) {
      const firebaseInstances = initializeFirebase();
      setFirebase(firebaseInstances);
    }
  }, []); // Empty dependency array ensures this runs only once on mount.

  // While Firebase is initializing, we can show a loader or nothing.
  // The AuthGuard will handle showing a loader until the user state is resolved.
  if (!firebase) {
    return null;
  }

  return (
    <FirebaseProvider
      app={firebase.app}
      auth={firebase.auth}
      firestore={firebase.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
