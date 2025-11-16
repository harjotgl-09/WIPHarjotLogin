'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export default function PersonalizePage() {
  const { user } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [incorrectWord, setIncorrectWord] = useState('');
  const [correctWord, setCorrectWord] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddCorrection = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to add a correction.',
      });
      return;
    }
    if (!incorrectWord || !correctWord) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill out both fields.',
      });
      return;
    }

    const correctionsKey = `wordCorrections-${user.uid}`;
    const savedCorrectionsRaw = localStorage.getItem(correctionsKey);
    const existingCorrections = savedCorrectionsRaw ? JSON.parse(savedCorrectionsRaw) : {};
    
    existingCorrections[incorrectWord.toLowerCase()] = correctWord;
    
    localStorage.setItem(correctionsKey, JSON.stringify(existingCorrections));

    console.log(`Mapping "${incorrectWord}" to "${correctWord}" for user ${user.uid}`);
    toast({
      title: 'Correction Added',
      description: `The app will now try to replace "${incorrectWord}" with "${correctWord}".`,
    });
    setIncorrectWord('');
    setCorrectWord('');
    router.push('/settings');
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-background text-foreground font-body">
      <header className="flex items-center p-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col px-6 py-2">
        <h1 className="text-3xl font-bold mb-8">Personalize</h1>
        <p className="text-muted-foreground mb-8">
          If the app consistently misunderstands a word, you can teach it the correct transcription here.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="incorrect-word" className="text-lg">Incorrect Transcription</Label>
            <Input
              id="incorrect-word"
              placeholder="e.g., 'wader'"
              value={incorrectWord}
              onChange={(e) => setIncorrectWord(e.target.value)}
              className="rounded-lg h-12 px-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correct-word" className="text-lg">Correct Word/Phrase</Label>
            <Input
              id="correct-word"
              placeholder="e.g., 'water'"
              value={correctWord}
              onChange={(e) => setCorrectWord(e.target.value)}
              className="rounded-lg h-12 px-4"
            />
          </div>
        </div>

        <Button
          className="w-full h-14 rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 mt-auto mb-4"
          onClick={handleAddCorrection}
        >
          Add Correction
        </Button>
      </main>
    </div>
  );
}
