'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const protectedRoutes = ['/']; // Add any other protected routes here
const publicRoutes = ['/login']; // Add any other public-only routes here

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; // Wait for the auth state to be resolved
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      // If not logged in and on a protected route, redirect to login
      router.replace('/login');
    } else if (user && isPublicRoute) {
      // If logged in and on a public-only route (like login), redirect to home
      router.replace('/');
    }
  }, [user, isLoading, router, pathname]);

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Determine if we should show a loader. This happens if:
  // 1. Auth state is still loading.
  // 2. A redirect is imminent (e.g., user is not logged in but on a protected route).
  const showLoader = isLoading || (!user && isProtectedRoute) || (user && isPublicRoute);

  if (showLoader) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
