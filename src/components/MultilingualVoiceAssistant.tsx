import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send, MessageCircle, Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const MultilingualVoiceAssistant = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const quickQuestions = {
    en: [
      "How to purify water?",
      "Diarrhea treatment",
      "Prevent mosquito diseases"
    ],
    hi: [
      "पानी कैसे साफ करें?",
      "दस्त का इलाज",
      "मच्छरों से बचाव"
    ],
    as: [
      "পানী কেনেকৈ শুদ্ধ কৰিব?",
      "ডায়েৰিয়াৰ চিকিৎসা",
      "মহৰ পৰা সুৰক্ষা"
    ],
    bn: [
      "জল কীভাবে বিশুদ্ধ করবেন?",
      "ডায়রিয়ার চিকিৎসা",
      "মশা থেকে সুরক্ষা"
    ]
  };

  const processMessage = async (message: string) => {
    if (!message.trim()) return;
    
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const { data, error } = await supabase.functions.invoke('health-chatbot', {
        body: {
          message: message,
          language: i18n.language,
        }
      });

      if (error) throw error;

      const responseText = data.response || data.reply || getDefaultResponse();
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

    } catch (error) {
      console.error('Error processing message:', error);
      const fallbackResponse = getDefaultResponse();
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
      
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Could not get response. Showing default help.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getDefaultResponse = () => {
    const responses: Record<string, string> = {
      en: "I'm Aqua, your health assistant. Ask me about water safety, diarrhea treatment, fever care, or disease prevention!",
      hi: "मैं एक्वा हूं, आपका स्वास्थ्य सहायक। मुझसे पानी की सुरक्षा, दस्त के इलाज, बुखार की देखभाल या बीमारी की रोकथाम के बारे में पूछें!",
      as: "মই একোয়া, আপোনাৰ স্বাস্থ্য সহায়ক। মোক পানীৰ সুৰক্ষা, ডায়েৰিয়াৰ চিকিৎসা বা ৰোগ প্ৰতিৰোধৰ বিষয়ে সোধক!",
      bn: "আমি একোয়া, আপনার স্বাস্থ্য সহায়ক। জল নিরাপত্তা, ডায়রিয়ার চিকিৎসা বা রোগ প্রতিরোধ সম্পর্কে জিজ্ঞাসা করুন!"
    };
    return responses[i18n.language] || responses.en;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    
    const message = textInput;
    setTextInput('');
    processMessage(message);
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Voice input is not supported in this browser.",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 
                       i18n.language === 'as' ? 'as-IN' :
                       i18n.language === 'bn' ? 'bn-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTextInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Could not recognize speech. Please try again.",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const currentQuestions = quickQuestions[i18n.language as keyof typeof quickQuestions] || quickQuestions.en;

  return (
    <Card className="p-5 bg-gradient-to-br from-card to-card/80 border-primary/20 shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {t('voiceAssistant')}
              <Sparkles className="h-4 w-4 text-accent" />
            </h3>
            <p className="text-xs text-muted-foreground">Powered by AI</p>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2">
          {currentQuestions.map((q, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => processMessage(q)}
              disabled={isProcessing}
              className="text-xs h-8 bg-primary/5 border-primary/20 hover:bg-primary/10"
            >
              {q}
            </Button>
          ))}
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-xl">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="p-1.5 bg-primary/20 rounded-lg h-fit">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-2 justify-start">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="p-3 rounded-xl bg-card border">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('askQuestion') || "Ask about health or water..."}
              disabled={isProcessing}
              className="pl-10 pr-4 h-12 bg-background/50"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleVoiceInput}
            disabled={isProcessing || isListening}
            className={`h-12 w-12 ${isListening ? 'bg-destructive/10 border-destructive text-destructive animate-pulse' : ''}`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button 
            type="submit" 
            disabled={isProcessing || !textInput.trim()}
            className="h-12 px-4 bg-gradient-to-r from-primary to-primary/80"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </Card>
  );
};