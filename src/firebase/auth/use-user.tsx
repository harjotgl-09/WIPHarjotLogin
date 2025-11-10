'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { useAuth } from '@/firebase';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.log("[useUser] Auth object not ready, skipping listener setup.");
      setIsLoading(false);
      return;
    }

    console.log("[useUser] Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(
      auth,
      (newUser) => {
        console.log(`[useUser] onAuthStateChanged triggered. New user UID: ${newUser?.uid || 'null'}.`);
        setUser(newUser);
        setIsLoading(false);
      },
      (error) => {
        console.error('[useUser] onAuthStateChanged error:', error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log("[useUser] Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    }
  }, [auth]);

  return { user, isLoading };
}
