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

    const isProtectedRoute = protectedRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      // If not logged in and on a protected route, redirect to login
      router.replace('/login');
    } else if (user && isPublicRoute) {
      // If logged in and on a public-only route (like login), redirect to home
      router.replace('/');
    }
  }, [user, isLoading, router, pathname]);

  // Show a loader while authentication is in progress or if a redirect is imminent
  const isProtectedRoute = protectedRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.includes(pathname);
  if (isLoading || (!user && isProtectedRoute) || (user && isPublicRoute)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
