'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

function SignInPage() {
  const auth = useAuth();
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsAuthenticating(false);
      return;
    }

    // This runs when the page loads, checking for a redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          // User has successfully signed in via redirect.
          // We can now redirect them to the home page.
          router.replace('/');
        } else {
          // No user from redirect, so we're done authenticating for now.
          // This allows the page to render the sign-in button.
          setIsAuthenticating(false);
        }
      })
      .catch((error) => {
        console.error('Error getting redirect result', error);
        setIsAuthenticating(false);
      });
  }, [auth, router]);


  useEffect(() => {
    // This effect handles the case where the user is already logged in
    // and visits the /login page directly.
    if (!isUserLoading && user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = () => {
    if (!auth) return;
    setIsAuthenticating(true);
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  // Show a loader while we are processing the redirect or if the user data is loading.
  // Also, if the user object exists, we should be in the process of redirecting, so show a loader.
  if (isAuthenticating || isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">SpeakIn'</h1>
        <p className="text-muted-foreground mb-8">
          Sign in to continue to your personal transcription service.
        </p>

        <div className="space-y-4">
           <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Sign in with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full h-12 text-lg"
            onClick={handleSignIn}
            disabled={isAuthenticating}
          >
            <svg
              className="mr-2 h-5 w-5"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8 0 120.9 109.8 11.8 244 11.8c70.3 0 129.5 27.8 175.2 73.2l-67.5 64.5C314.6 118.5 282.5 96.2 244 96.2c-100.3 0-181.9 83.4-181.9 185.6s81.6 185.6 181.9 185.6c105.9 0 160.2-79.8 166-138.2H244v-73.4h239.9c1.4 12.3 2.1 24.3 2.1 36.9z"
              ></path>
            </svg>
            Google
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <SignInPage />;
}
