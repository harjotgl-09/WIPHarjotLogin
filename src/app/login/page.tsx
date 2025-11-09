'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Start in a processing state to handle the redirect result first.
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    // This effect runs once on mount to handle the redirect result.
    if (!auth) {
      // If auth is not ready, stop processing.
      setIsProcessingRedirect(false);
      return;
    };

    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        // If result exists and has a user, the onAuthStateChanged listener
        // in our useUser hook will be notified, and the AuthGuard will handle the redirect.
        // We just need to stop showing the loader.
        if (result && result.user) {
           // Successfully signed in. AuthGuard will handle the redirect.
           // The user object in the useUser hook is now populated.
        }
      } catch (error: any) {
        console.error("Authentication error from redirect:", error.message);
        toast({
          variant: "destructive",
          title: "Sign-In Error",
          description: error.message || "An error occurred during sign-in.",
        });
      } finally {
        // Whether there was a redirect or not, we are done processing.
        // If there was no redirect, we can now show the sign-in button.
        setIsProcessingRedirect(false);
      }
    };

    processRedirectResult();
  }, [auth, toast]);


  const handleSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      // This will redirect the user to Google's sign-in page
      await signInWithRedirect(auth, provider);
      // After this call, the user is redirected away, so we don't need to do anything else.
    } catch (error: any) {
      console.error("Authentication error on sign-in initiation:", error.message);
      toast({
        variant: "destructive",
        title: "Sign-In Error",
        description: error.message || "Could not start the sign-in process.",
      });
      setIsSigningIn(false);
    }
  };

  // While processing the redirect, show a full-page loader.
  // This is the most crucial part to prevent race conditions.
  if (isProcessingRedirect) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If the user is already logged in, AuthGuard will redirect them.
  // We can show a loader here as well to avoid a flash of the login page.
  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">SpeakIn'</h1>
        
        <p className="text-muted-foreground mb-4">
            Welcome, {user ? user.displayName : 'null'}
        </p>
        
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
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
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
            )}
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
