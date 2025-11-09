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
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setIsLoading(false);
      },
      (error) => {
        console.error('[useUser] Auth state change error', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, isLoading };
}
