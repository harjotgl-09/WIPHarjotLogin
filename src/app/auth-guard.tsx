'use client';

import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const protectedRoutes = ['/'];
const publicRoutes = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      // Don't do anything while auth state is loading.
      return;
    }

    const pathIsProtected = protectedRoutes.includes(pathname);
    const pathIsPublic = publicRoutes.includes(pathname);

    if (!user && pathIsProtected) {
      // If user is not logged in and on a protected route, redirect to login.
      router.replace('/login');
    } else if (user && pathIsPublic) {
      // If user is logged in and on a public route (like login), redirect to home.
      router.replace('/');
    }
  }, [isLoading, user, pathname, router]);

  // While loading, or while a redirect is in progress, show a loader.
  // This prevents flashing content.
  if (isLoading || (!user && protectedRoutes.includes(pathname)) || (user && publicRoutes.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we are not loading and no redirect is needed, show the page content.
  return <>{children}</>;
}
