import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Message {
  role: "bot" | "user";
  text: string;
}

const FAQ: { q: string; a: string }[] = [
  { q: "how to submit a report", a: "Go to the Reports page from the sidebar. Select your village, enter symptoms, number of cases, and your name. Click Submit Report." },
  { q: "how to use voice", a: "On the Awareness page, click the Voice Assistant section. Tap the microphone button and speak in your language." },
  { q: "what is the map", a: "The Map View shows a live heatmap of disease risk across villages. Red = High Risk, Yellow = Medium, Green = Safe." },
  { q: "how to earn points", a: "Complete health quizzes on the Awareness page, submit health reports, and maintain daily streaks to earn points and badges." },
  { q: "how to export data", a: "Go to Export Reports from the sidebar. Select report type, village, and date range. Click Export CSV or Export PDF." },
  { q: "what is risk score", a: "The Risk Score (0-100) combines water quality sensor data, health reports, and weather data to predict outbreak probability." },
  { q: "how to upload images", a: "Go to Image Analysis from the sidebar. Choose water body or pathogen image type, upload a photo, and click Analyze." },
  { q: "offline", a: "The app works offline! Reports submitted without internet are saved locally and automatically synced when connection returns." },
  { q: "sms", a: "Users without smartphones can send SMS reports. Format: REPORT [village] [symptoms] [cases]. Send to the designated number." },
  { q: "alert", a: "Alerts are triggered automatically when water quality sensors detect unsafe levels or AI predicts an outbreak. You'll get notifications and SMS." },
];

const findAnswer = (input: string, brandTitle: string): string => {
  const lower = input.toLowerCase();
  const match = FAQ.find(f => f.q.split(" ").some(word => lower.includes(word)) && f.q.split(" ").filter(word => lower.includes(word)).length >= 2);
  if (match) return match.a;
  
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("help")) {
    return `Hello! I'm ${brandTitle} Bot. I can help you with:\n• Submitting reports\n• Using the map\n• Earning points & badges\n• Exporting data\n• Image analysis\n• Offline mode\n\nJust ask me anything!`;
  }
  return "I'm not sure about that. Try asking about: submitting reports, using the map, earning points, exporting data, image analysis, or offline mode. For urgent issues, contact your local ASHA worker.";
};

export const GuidanceBot = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! I'm AquaGuard Bot 🤖\nHow can I help you use the app today?" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "bot", text: findAnswer(userMsg, t('branding.title')) }]);
    }, 500);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setOpen(true)}
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden"
            style={{ height: "480px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">AquaGuard Bot</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1"
              />
              <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
