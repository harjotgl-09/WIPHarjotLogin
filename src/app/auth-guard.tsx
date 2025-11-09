'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const protectedRoutes = ['/']; // The main page is protected
const publicRoutes = ['/login']; // The login page is public

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isLoading) {
      // Wait for auth state to be resolved and client to be mounted before making decisions.
      return;
    }

    const isProtectedRoute = protectedRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      // If the user is not logged in and is on a protected route, redirect to login.
      router.replace('/login');
    } else if (user && isPublicRoute) {
      // If the user is logged in and is on a public-only route (like login), redirect to home.
      router.replace('/');
    }
  }, [user, isLoading, router, pathname, isClient]);

  // Determine if we should show a loader. This is crucial to prevent content flashing.
  const isProtectedRoute = protectedRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.includes(pathname);
  const showLoader = 
    !isClient || 
    isLoading || 
    (!user && isProtectedRoute) || // Show loader while we are about to redirect an unauth user
    (user && isPublicRoute); // Show loader while we are about to redirect a logged-in user

  if (showLoader) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we are not loading and no redirect is needed, show the page content.
  return <>{children}</>;
}
