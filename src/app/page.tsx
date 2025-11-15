'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Volume2, Menu, Settings, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeWithHuggingFace } from '@/ai/flows/transcribe-with-hugging-face';
import {
  detectEmotion,
  type DetectEmotionOutput,
  type Emotion,
} from '@/ai/flows/detect-emotion';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';


const emotionColorMap: Record<Emotion, string> = {
  joy: 'text-emotion-joy',
  anger: 'text-emotion-anger',
  sadness: 'text-emotion-sadness',
  surprise: 'text-emotion-surprise',
  neutral: 'text-emotion-neutral',
};

const emotionHslMap: Record<Emotion, string> = {
    joy: 'hsl(var(--emotion-joy) / 0.1)',
    anger: 'hsl(var(--emotion-anger) / 0.1)',
    sadness: 'hsl(var(--emotion-sadness) / 0.1)',
    surprise: 'hsl(var(--emotion-surprise) / 0.1)',
    neutral: 'hsl(var(--emotion-neutral) / 0.1)',
};

const PulsatingRings = ({
  emotion,
  isRecording,
  isTranscribing,
  onClick,
}: {
  emotion: Emotion;
  isRecording: boolean;
  isTranscribing: boolean;
  onClick: () => void;
}) => {
  const rings = [
    { delay: 'delay-0', scale: 'scale-75' },
    { delay: 'delay-100', scale: 'scale-90' },
    { delay: 'delay-200', scale: 'scale-100' },
  ];

  const colorClass = emotionColorMap[emotion];

  return (
    <div
      className="w-96 h-96 flex items-center justify-center cursor-pointer"
      onClick={onClick}
      role="button"
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      <div className={`relative flex items-center justify-center ${colorClass}`}>
        {/* Translucent outer layer */}
        <div
          className="absolute rounded-full"
          style={{ 
            width: '130%', 
            height: '130%', 
            backgroundColor: emotionHslMap[emotion],
            transition: 'background-color 0.5s ease',
          }}
        />
        {rings.map((ring, index) => (
          <div
            key={index}
            className={cn(
              'absolute rounded-full border-4 transition-colors duration-500',
              isRecording ? 'border-red-500 animate-pulse-strong' : `border-current animate-pulse-gentle ${ring.delay}`,
              ring.scale
            )}
            style={{
                width: '100%',
                height: '100%',
                animationDuration: '1.2s'
            }}
          />
        ))}
        <div
          className={cn(
            'absolute w-36 h-36 rounded-full flex items-center justify-center transition-colors duration-500',
            isRecording ? 'bg-red-500' : 'bg-current'
          )}
        >
          {isTranscribing ? (
            <Loader2 className="w-16 h-16 text-background animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-background"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};


export default function Home() {
  const { user } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [userInput, setUserInput] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [emotionResult, setEmotionResult] = useState<DetectEmotionOutput>({
    emotion: 'neutral',
    confidence: 1.0,
  });


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (audioUrl && isClient) {
      handleTranscribeAndAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, isClient]);

  const handleStartRecording = async () => {
    if (isTranscribing || !isClient) return;
    setAudioUrl(null);
    setTranscription('');
    setUserInput('Listening...');
    setEmotionResult({ emotion: 'neutral', confidence: 1.0 });
    audioChunksRef.current = [];
    setIsRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!supportedMimeType) {
        throw new Error('No supported audio format found for recording.');
      }
      
      const options = { mimeType: supportedMimeType };
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioUrl(base64Audio);
          setUserInput('');
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          toast({
            variant: "destructive",
            title: "File Reading Error",
            description: "Could not read the recorded audio data.",
          });
          setUserInput('');
          setIsTranscribing(false);
        };
      };

      mediaRecorderRef.current.start(100);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setUserInput('');
      let description = "Could not start recording. Please ensure you have given microphone permissions.";
      if (error instanceof Error) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: description,
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const handleTranscribeAndAnalyze = async () => {
    if (!audioUrl) return;

    setIsTranscribing(true);
    setTranscription('');

    try {
      console.log('Starting transcription...');
      const resultText = await transcribeWithHuggingFace({ audioDataUri: audioUrl });
      console.log('Transcription successful:', resultText);
      setTranscription(resultText);
      setUserInput(resultText);

      if (resultText) {
        console.log('Starting emotion detection...');
        const emotionData = await detectEmotion({ text: resultText });
        console.log('Emotion detection successful:', emotionData);

        if (emotionData.confidence < 0.6) {
          console.log('Confidence below threshold, falling back to neutral.');
          setEmotionResult({ emotion: 'neutral', confidence: emotionData.confidence });
        } else {
          setEmotionResult(emotionData);
        }
      }
    } catch (error: any) {
      console.error('Error in transcription or analysis pipeline:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "There was a problem communicating with the AI models.",
      });
      setEmotionResult({ emotion: 'neutral', confidence: 1.0 });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleReplayInput = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
    }
  };
  
  const handleSpeakTranscription = () => {
    if (transcription && isClient) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(transcription);
        window.speechSynthesis.speak(utterance);
      } else {
        toast({
          variant: 'destructive',
          title: 'Unsupported',
          description: 'Text-to-speech is not supported in your browser.',
        });
      }
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };
  
  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-background text-foreground font-body">
      <header className="flex justify-between items-center p-4">
        <div className='flex items-center gap-2'>
          <h1 className="text-xl font-bold text-primary">SpeakIn'</h1>
          <span className="text-sm text-muted-foreground">Hi, {user ? user.displayName?.split(' ')[0] : 'Guest'}</span>
        </div>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div className="flex-1 flex items-center justify-center" aria-live="polite">
          <PulsatingRings
            emotion={emotionResult.emotion}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            onClick={handleMicClick}
          />
        </div>

        <div className="w-full space-y-2">
          {audioUrl && !isTranscribing && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleReplayInput}>
                <Play className="w-4 h-4 mr-2" />
                Replay Input
              </Button>
            </div>
          )}
          <Input
            placeholder={isRecording ? "Listening..." : "Your transcription will appear here."}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full rounded-full h-14 px-6 text-lg text-center"
            disabled={isRecording || isTranscribing}
            readOnly={!transcription}
          />
        </div>
      </main>

      <footer className="flex justify-between items-center p-4">
        <Button variant="ghost" size="icon">
          <Menu className="w-6 h-6 text-muted-foreground" />
        </Button>
        <div aria-live="polite" className="sr-only">
          {`Detected emotion: ${emotionResult.emotion}`}
        </div>
        <Button variant="ghost" size="icon" onClick={handleSpeakTranscription} disabled={!transcription}>
          <Volume2 className="w-6 h-6 text-muted-foreground" />
        </Button>
      </footer>
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
    </div>
  );
}
