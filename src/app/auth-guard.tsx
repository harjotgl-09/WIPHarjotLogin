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
    // If we are still loading the user state, don't do anything yet.
    if (isLoading) {
      return;
    }

    const isProtectedRoute = protectedRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      // If the user is not logged in and trying to access a protected route,
      // redirect them to the login page.
      router.replace('/login');
    } else if (user && isPublicRoute) {
      // If the user is logged in and trying to access a public-only route (like login),
      // redirect them to the home page.
      router.replace('/');
    }
  }, [user, isLoading, router, pathname]);

  // While the user state is loading, or if a redirect is imminent,
  // show a full-page loader to prevent content flicker.
  const isProtectedRoute = protectedRoutes.includes(pathname);
  if (isLoading || (!user && isProtectedRoute)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is logged in and trying to access a public route (like login),
  // we also show a loader while the redirect to '/' happens.
  const isPublicRoute = publicRoutes.includes(pathname);
if (user && isPublicRoute) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
}


  return <>{children}</>;
}
