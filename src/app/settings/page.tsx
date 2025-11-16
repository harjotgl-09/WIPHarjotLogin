'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';


type Emotion = 'Neutral' | 'Joy' | 'Anger' | 'Surprise' | 'Sadness';
type Color = 'Purple' | 'Yellow' | 'Red' | 'Green' | 'Blue';

const colorMap: Record<Color, string> = {
  Purple: 'bg-purple-500',
  Yellow: 'bg-yellow-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  Blue: 'bg-blue-500',
};

const emotionData: { emotion: Emotion; defaultColor: Color }[] = [
  { emotion: 'Neutral', defaultColor: 'Purple' },
  { emotion: 'Joy', defaultColor: 'Yellow' },
  { emotion: 'Anger', defaultColor: 'Red' },
  { emotion: 'Surprise', defaultColor: 'Green' },
  { emotion: 'Sadness', defaultColor: 'Blue' },
];

const defaultEmotionColors = emotionData.reduce((acc, item) => {
  acc[item.emotion] = item.defaultColor;
  return acc;
}, {} as Record<Emotion, Color>);

export default function SettingsPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [emotionColors, setEmotionColors] = useState<Record<Emotion, Color>>(defaultEmotionColors);
  const [micAccess, setMicAccess] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load from localStorage
    const savedName = localStorage.getItem('userName');
    const savedAge = localStorage.getItem('userAge');
    const savedGender = localStorage.getItem('userGender');
    const savedColors = localStorage.getItem('emotionColors');
    const micAccessSaved = localStorage.getItem('micAccess');

    // Set name: use saved name, otherwise use user's display name if available
    if (savedName) {
      setName(savedName);
    } else if (user?.displayName) {
      setName(user.displayName);
    }

    if (savedAge) setAge(savedAge);
    if (savedGender) setGender(savedGender);
    if (savedColors) setEmotionColors(JSON.parse(savedColors));
    if (micAccessSaved !== null) setMicAccess(JSON.parse(micAccessSaved));
    
    // Set user-specific details that are not editable
    if (user) {
      setEmail(user.email || '');
    }
  }, [user]);

  const handleColorChange = (emotion: Emotion, color: Color) => {
    setEmotionColors((prev) => ({ ...prev, [emotion]: color }));
  };

  const handleSaveChanges = () => {
    localStorage.setItem('userName', name);
    localStorage.setItem('userAge', age);
    localStorage.setItem('userGender', gender);
    localStorage.setItem('emotionColors', JSON.stringify(emotionColors));
    localStorage.setItem('micAccess', JSON.stringify(micAccess));
    console.log('Saving changes:', { name, age, gender, emotionColors, micAccess });
    toast({
      title: "Changes Saved!",
      description: "Your settings have been updated.",
    });
    router.push('/');
  };

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      // Clear local storage on sign out for privacy and to prevent data mixing between accounts
      localStorage.removeItem('userName');
      localStorage.removeItem('userAge');
      localStorage.removeItem('userGender');
      localStorage.removeItem('emotionColors');
      localStorage.removeItem('micAccess');
      router.push('/login');
    }
  };
  
  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-background text-foreground font-body">
      <header className="flex justify-between items-center p-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col px-6 py-2 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <h2 className="text-2xl font-bold mb-4">User Profile</h2>
        <div className="space-y-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-full h-12 px-6"
          />
          <Input
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="rounded-full h-12 px-6"
            type="number"
          />
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="rounded-full h-12 px-6">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Email"
            value={email}
            className="rounded-full h-12 px-6 bg-muted cursor-not-allowed"
            type="email"
            readOnly
          />
        </div>

        <Separator className="my-8 bg-primary h-0.5" />

        <h2 className="text-2xl font-bold mb-4">Emotion Colours</h2>
        <div className="space-y-4 mb-8">
          {emotionData.map(({ emotion }) => (
            <div key={emotion} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("w-6 h-6 rounded-full", colorMap[emotionColors[emotion]])} />
                <span className="text-lg">{emotion}</span>
              </div>
              <Select
                value={emotionColors[emotion]}
                onValueChange={(value: Color) => handleColorChange(emotion, value)}
              >
                <SelectTrigger className="w-32 rounded-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(colorMap).map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold">Microphone Access</h3>
            <p className="text-sm text-muted-foreground">Allow app to access microphone for voice features</p>
          </div>
          <Switch checked={micAccess} onCheckedChange={setMicAccess} />
        </div>

        <Link href="/personalize" className="flex items-center justify-between mb-8 cursor-pointer">
          <div>
            <h3 className="text-lg font-semibold">Personalize</h3>
            <p className="text-sm text-muted-foreground">Add custom sounds and words</p>
          </div>
          <ChevronRight className="w-6 h-6 text-muted-foreground" />
        </Link>
        
        <div className="mt-auto">
          <Button
            variant="outline"
            className="w-full h-14 rounded-full text-lg font-semibold mb-4"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>

          <Button 
            className="w-full h-14 rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 mb-4"
            onClick={handleSaveChanges}
          >
              Save Changes
          </Button>
        </div>
      </main>
    </div>
  );
}
