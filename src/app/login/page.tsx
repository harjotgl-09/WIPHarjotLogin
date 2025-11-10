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
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Start in a processing state to handle the redirect result first.
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.log("[Login Page] Auth object not available yet.");
      return;
    }

    console.log("[Login Page] useEffect triggered to process redirect.");
    const processRedirectResult = async () => {
      try {
        console.log("[Login Page] Calling getRedirectResult...");
        const result = await getRedirectResult(auth);
        console.log("[Login Page] getRedirectResult result:", result);
        
        if (result && result.user) {
           console.log("[Login Page] Successfully got user from redirect result:", result.user.uid);
           // Successfully got user from redirect result.
           // The onAuthStateChanged listener will fire, and the AuthGuard is now responsible for the redirect to '/'.
        } else {
           console.log("[Login Page] No user found in redirect result. This is a normal page load.");
        }
      } catch (error: any) {
        console.error("[Login Page] Authentication error from getRedirectResult:", error.message, error.code);
        toast({
          variant: "destructive",
          title: "Sign-In Error",
          description: error.message || "An error occurred during sign-in.",
        });
      } finally {
        console.log("[Login Page] Finished processing redirect. Setting isProcessingRedirect to false.");
        setIsProcessingRedirect(false);
      }
    };

    processRedirectResult();
  }, [auth, toast]);


  const handleSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    console.log("[Login Page] Starting sign-in with redirect.");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // The redirect will navigate the user away, so no further action is needed here.
    } catch (error: any) {
      console.error("[Login Page] Authentication error on sign-in initiation:", error.message);
      toast({
        variant: "destructive",
        title: "Sign-In Error",
        description: error.message || "Could not start the sign-in process.",
      });
      setIsSigningIn(false);
    }
  };
  
  // While processing the redirect, show a full-page loader.
  // This is the most crucial state to prevent race conditions.
  if (isProcessingRedirect) {
    console.log("[Login Page] Rendering loader while processing redirect.");
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying login...</p>
      </div>
    );
  }

  // If we are done processing the redirect AND the user is already logged in (which means AuthGuard will redirect soon),
  // it can be good to show a loader too, to avoid a flash of the login button.
  if (user) {
    console.log(`[Login Page] Rendering loader because user object exists (uid: ${user.uid}). Waiting for AuthGuard redirect.`);
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  console.log("[Login Page] Rendering sign-in button.");
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">SpeakIn'</h1>
        
        <p className="text-muted-foreground mb-8">
          Sign in to continue to your personal transcription service. User: {user ? user.displayName : 'null'}
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
