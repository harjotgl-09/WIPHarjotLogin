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
    console.log('[AuthGuard] Running effect. isLoading:', isLoading, 'user:', user, 'pathname:', pathname);
    // Wait until the authentication state is fully loaded
    if (isLoading) {
      console.log('[AuthGuard] Still loading, waiting...');
      return; // Do nothing while loading
    }

    const pathIsProtected = protectedRoutes.includes(pathname);
    const pathIsPublic = publicRoutes.includes(pathname);

    // If user is not logged in and is trying to access a protected route
    if (!user && pathIsProtected) {
      console.log('[AuthGuard] User not logged in, redirecting to /login');
      router.replace('/login');
    }
    // If user is logged in and on a public route (like login), redirect to home.
    else if (user && pathIsPublic) {
      console.log('[AuthGuard] User is logged in and on a public route, redirecting to /');
      router.replace('/');
    } else {
      console.log('[AuthGuard] No redirection needed.');
    }
  }, [isLoading, user, pathname, router]);

  // While loading authentication state OR during the brief moment a redirect is happening, show a loader.
  // This prevents a flash of the old page's content.
  if (isLoading || (!user && protectedRoutes.includes(pathname)) || (user && publicRoutes.includes(pathname))) {
    console.log('[AuthGuard] Rendering Loader');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  console.log('[AuthGuard] Rendering children');
  // If not loading and no redirect is needed, render the children
  return <>{children}</>;
}
