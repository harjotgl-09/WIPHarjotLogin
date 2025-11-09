'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Loader2, Volume2, Menu, Settings, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeWithHuggingFace } from '@/ai/flows/transcribe-with-hugging-face';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [userInput, setUserInput] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (audioUrl && isClient) {
      handleTranscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, isClient]);

  const handleStartRecording = async () => {
    if (isTranscribing || !isClient) return;
    setAudioUrl(null);
    setTranscription('');
    setUserInput('Listening...');
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

      mediaRecorderRef.current.start(100); // Start recording with a 100ms timeslice
      
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

  const handleTranscribe = async () => {
    if (!audioUrl) return;
  
    setIsTranscribing(true);
    setTranscription('');
  
    try {
      const resultText = await transcribeWithHuggingFace({ audioDataUri: audioUrl });
      setTranscription(resultText);
      setUserInput(resultText);
    } catch (error: any) {
        console.error('Error transcribing:', error);
        toast({
          variant: "destructive",
          title: "Transcription Failed",
          description: error.message || "There was a problem communicating with the AI model.",
        });
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
  
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-background text-foreground font-body">
      <header className="flex justify-between items-center p-4">
        <h1 className="text-xl font-bold text-primary">SpeakIn'</h1>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div className="flex-1 flex items-center justify-center">
          <div
            className={`w-40 h-40 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center relative bg-primary ring-8 ring-primary/30 ${isRecording ? 'bg-red-500 ring-red-500/30' : ''}`}
          >
            <Button
              onClick={handleMicClick}
              className={`w-full h-full rounded-full flex items-center justify-center bg-transparent hover:bg-transparent`}
              disabled={isTranscribing}
            >
              {isTranscribing ? <Loader2 className="w-16 h-16 text-primary-foreground animate-spin" /> : <Mic className="w-16 h-16 text-primary-foreground" />}
            </Button>
          </div>
        </div>

        <div className="w-full space-y-2">
            {audioUrl && (
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
        <Button variant="ghost" size="icon" onClick={handleSpeakTranscription} disabled={!transcription}>
            <Volume2 className="w-6 h-6 text-muted-foreground" />
        </Button>
      </footer>
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
    </div>
  );
}
