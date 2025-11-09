'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const protectedRoutes = ['/', '/settings', '/personalize']; // Add any other protected routes here
const publicRoutes = ['/login']; // Add any other public-only routes here

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
      return; // Wait for the auth state to be resolved and client to be mounted
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname === route);
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      // If not logged in and on a protected route, redirect to login
      router.replace('/login');
    } else if (user && isPublicRoute) {
      // If logged in and on a public-only route (like login), redirect to home
      router.replace('/');
    }
  }, [user, isLoading, router, pathname, isClient]);

  // Determine if we should show a loader. This happens if:
  // 1. Auth state is still loading or it's not client-side yet.
  // 2. A redirect is imminent (e.g., user is not logged in but on a protected route, or user is logged in but on a public route).
  const isProtectedRoute = protectedRoutes.some(route => pathname === route);
  const isPublicRoute = publicRoutes.includes(pathname);
  const showLoader = !isClient || isLoading || (!user && isProtectedRoute) || (user && isPublicRoute);

  if (showLoader) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
