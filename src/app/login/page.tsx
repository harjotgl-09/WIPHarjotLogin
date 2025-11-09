'use client';

import { useEffect, useState } from 'react';
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
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs once on mount to handle the redirect result.
    if (auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            // User successfully signed in.
            // The AuthGuard will handle the redirect to '/'.
            // We just need to stop showing the loader here.
            // The onAuthStateChanged listener will pick up the new user.
          }
          // If result is null, it means this is not a redirect flow.
        })
        .catch((error) => {
          // Handle errors from the redirect.
          console.error("Authentication error after redirect:", error.message);
          toast({
            variant: "destructive",
            title: "Sign-In Error",
            description: error.message || "An error occurred during sign-in.",
          });
        })
        .finally(() => {
          // In either case (redirect processed or no redirect), we can stop the loader.
          setIsProcessingRedirect(false);
        });
    } else {
        // If auth is not ready, stop the loader. The AuthGuard will handle the auth-not-ready state.
        setIsProcessingRedirect(false);
    }
  }, [auth, toast, router]);


  const handleSignIn = () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };
  
  // Show a loader while we are processing the potential redirect.
  // The AuthGuard will also be showing a loader if the user state is not resolved yet,
  // but this one is specific to the redirect result processing.
  if (isProcessingRedirect) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
  }

  // If the user is already authenticated (and we are done processing the redirect),
  // the AuthGuard will redirect them away. In the meantime, we can show a loader
  // or a minimal UI.
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
            disabled={!!user}
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
