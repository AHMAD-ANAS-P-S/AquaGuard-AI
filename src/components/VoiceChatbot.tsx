import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Volume2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const VoiceChatbot = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Local TTS fallback using Web Speech API
  const speakLocal = (text: string, lang = 'en-IN') => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const voices = speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0]));
      if (match) utterance.voice = match;
      utterance.onend = () => setIsPlaying(false);
      setIsPlaying(true);
      speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Local TTS failed', e);
    }
  };

  // Local STT fallback using Web Speech API
  const transcribeWithBrowser = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) return reject(new Error('On-device speech recognition not supported'));
      const rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => resolve(e.results[0][0].transcript);
      rec.onerror = (e: any) => reject(new Error(e.error || 'Speech recognition error'));
      rec.onend = () => console.log('Browser STT ended');
      rec.start();
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access microphone",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];

        let userText: string | null = null;

        // Try server STT first
        try {
          const { data: transcription, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
            body: { audio: base64Audio, language: 'en' }
          });
          if (transcriptionError) throw transcriptionError;
          if (transcription?.text) userText = transcription.text;
        } catch (sttErr: any) {
          console.warn('Server STT failed, falling back to browser STT:', sttErr?.message || sttErr);
          try {
            userText = await transcribeWithBrowser();
          } catch (localErr) {
            throw new Error('Speech recognition failed. Please ensure microphone access is granted.');
          }
        }

        if (!userText) throw new Error('No text transcribed from audio');

        setMessages(prev => [...prev, { role: 'user', content: userText! }]);

        // Chatbot response (Lovable AI backed edge function)
        const { data: botResponse, error: chatError } = await supabase.functions.invoke('health-chatbot', {
          body: { message: userText, language: 'en' }
        });
        if (chatError) throw new Error(`Chatbot failed: ${chatError.message}`);

        if (botResponse?.reply) {
          setMessages(prev => [...prev, { role: 'assistant', content: botResponse.reply }]);

          // Try server TTS first
          try {
            const { data: audioData, error: audioError } = await supabase.functions.invoke('text-to-speech', {
              body: { text: botResponse.reply, voice: 'alloy' }
            });
            if (audioError) throw audioError;
            if (audioData?.audioContent) {
              playAudio(audioData.audioContent);
            } else if (audioData?.error) {
              throw new Error(audioData.error);
            }
          } catch (ttsErr: any) {
            console.warn('Server TTS failed, falling back to local speech:', ttsErr?.message || ttsErr);
            speakLocal(botResponse.reply, 'en-IN');
            toast({ title: 'Using device voice', description: 'Playing response with on-device speech.' });
          }
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process audio.',
      });
    }
  };

  const playAudio = (base64Audio: string) => {
    setIsPlaying(true);
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.onended = () => setIsPlaying(false);
    audio.play();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Voice Health Assistant</h3>
          <p className="text-sm text-muted-foreground">Ask Aqua about water safety</p>
        </div>
      </div>

      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-primary/10 ml-8' 
                : 'bg-muted/50 mr-8'
            }`}
          >
            <p className="text-sm text-foreground">{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {!isRecording ? (
          <Button 
            onClick={startRecording}
            className="flex-1 gap-2"
            disabled={isPlaying}
          >
            <Mic className="w-4 h-4" />
            Start Speaking
          </Button>
        ) : (
          <Button 
            onClick={stopRecording}
            variant="destructive"
            className="flex-1 gap-2"
          >
            <MicOff className="w-4 h-4" />
            Stop Recording
          </Button>
        )}
        {isPlaying && (
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <Volume2 className="w-4 h-4 animate-pulse text-primary" />
            <span className="text-sm text-muted-foreground">Playing...</span>
          </div>
        )}
      </div>
    </Card>
  );
};
