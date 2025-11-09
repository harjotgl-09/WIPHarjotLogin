'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Routes that do not require authentication
const publicRoutes = ['/login'];

// Routes that require authentication
const protectedRoutes = ['/', '/settings', '/personalize'];


export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until the authentication state is fully loaded
    if (isLoading) {
      return; // Do nothing while loading
    }

    const pathIsProtected = protectedRoutes.includes(pathname);
    const pathIsPublic = publicRoutes.includes(pathname);

    // If user is not logged in and is trying to access a protected route
    if (!user && pathIsProtected) {
      router.replace('/login');
    }
    // If user is logged in and is trying to access a public route (like the login page)
    else if (user && pathIsPublic) {
      router.replace('/');
    }
  }, [isLoading, user, pathname, router]);

  // While loading authentication state, show a full-screen loader.
  // Also, show a loader during the brief moment a redirect is happening
  // to prevent a flash of the old page's content.
  if (isLoading || (!user && protectedRoutes.includes(pathname)) || (user && publicRoutes.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and no redirect is needed, render the children
  return <>{children}</>;
}
