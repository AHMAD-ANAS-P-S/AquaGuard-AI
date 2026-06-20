import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Volume2, Book, Award, Languages, Mic, Trophy, Star, Target, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuizModal } from "@/components/QuizModal";
import { VoiceChatbot } from "@/components/VoiceChatbot";
import { SMSReporter } from "@/components/SMSReporter";
import { Leaderboard } from "@/components/Leaderboard";

const Awareness = () => {
  const { toast } = useToast();
  const [playingAudio, setPlayingAudio] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizType, setQuizType] = useState("");

  const playAudioGuide = async (language: string) => {
    setPlayingAudio(true);
    
    const tips: Record<string, string> = {
      "English": "Always boil drinking water for at least 10 minutes. Wash hands with soap before eating and after using the toilet. Keep water containers covered to prevent contamination.",
      "Hindi": "पीने के पानी को कम से कम 10 मिनट तक उबालें। खाने से पहले और शौचालय का उपयोग करने के बाद साबुन से हाथ धोएं। पानी के बर्तनों को ढककर रखें।",
      "Assamese": "পানীয় পানী কমেও ১০ মিনিট উতলাওক। খোৱাৰ আগতে আৰু শৌচাগাৰ ব্যৱহাৰৰ পিছত চাবোনেৰে হাত ধুব।",
      "Bengali": "পানীয় জল কমপক্ষে ১০ মিনিট ফুটান। খাওয়ার আগে এবং টয়লেট ব্যবহারের পরে সাবান দিয়ে হাত ধুয়ে নিন।",
      "Bodo": "दांगो दै गोबां १० मिनिट बायदि गोजौ। जाबाय सिगां आरो टयलेट बाहाय होनाय जोबिथा साबुन जों खुं गयबि।",
      "Karbi": "Chethan ri long kecho rek chini phai arni ke arsi bak phatlo. La arnan rek chekpolo hala aru toilet kebang isi pulo soap bangta lakma kok phatlo.",
      "Mising": "Omik ong-ka 10 minut ke-ang kayik anggone. Je-ang kom ane toilet do-ang o:m lo-sobon-do lakme sii anggo.",
      "Nepali": "पिउने पानी कम्तीमा १० मिनेट उमाल्नुहोस्। खाना खानु अघि र शौचालय प्रयोग गरेपछि साबुनले हात धुनुहोस्।",
      "Mizo": "In tui chu minit 10 thleng chu a bilh tur a ni. Ei hmain leh toilet hmang zawh ah chuan soap hmang in kut sil thin tur a ni.",
      "Khasi": "Ka bor ka um ka dieng ka um ka sngi 10 minit. Ka jingla ka em ka jingthung leh ka bam ka toilet ka khlem soap.",
      "Manipuri": "থক্-থোই তোয়না ওইরিবা ঈশিং মিনট ১০ ফাওবা ফুহনবা। চাক চরিঙৈদা অমসুং টয়লেত শিজিন্নবগী মতুংদা মখুৎ শাবোন শিজিন্নদুনা হানথাগদবনি।",
      "Nagamese": "Khabole pani komti pura 10 minute tak ubali lobi. Kha agote aru toilet kora pichete sabun pora hath dhubi."
    };

    try {
      const content = tips[language] || tips["English"];
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: content, voice: 'alloy' }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.onended = () => setPlayingAudio(false);
        audio.onerror = () => {
          setPlayingAudio(false);
          toast({
            variant: "destructive",
            title: "Audio Error",
            description: "Could not play audio file"
          });
        };
        await audio.play();
        
        toast({
          title: "Playing Audio",
          description: `Playing water safety tips in ${language}`,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setPlayingAudio(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not play audio. Please check if OPENAI_API_KEY is configured.",
      });
    }
  };

  const openQuiz = (type: string) => {
    setQuizType(type);
    setQuizOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:pl-72 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Health Awareness</h1>
          <p className="text-muted-foreground">
            Community education and disease prevention resources
          </p>
        </div>

        <Tabs defaultValue="prevention" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="prevention">Prevention</TabsTrigger>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1"><Trophy className="w-3 h-3" />Rankings</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="prevention" className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Volume2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Audio Message - Safe Water Practices
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Listen to important guidelines in your local language
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      className="gap-2"
                      onClick={() => playAudioGuide(selectedLanguage)}
                      disabled={playingAudio}
                    >
                      <Volume2 className="w-4 h-4" />
                      {playingAudio ? "Playing..." : `Play Audio (${selectedLanguage})`}
                    </Button>
                    <p className="text-xs text-muted-foreground self-center">
                      Select your language from the Languages tab
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Book className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Water Safety Tips</h3>
                    <p className="text-sm text-muted-foreground">Essential guidelines</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-foreground">
                  <li className="flex gap-2">
                    <span className="text-secondary font-bold">•</span>
                    Always boil water for at least 20 minutes before drinking
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary font-bold">•</span>
                    Use clean, covered containers for water storage
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary font-bold">•</span>
                    Check water clarity - cloudy water should not be consumed
                  </li>
                  <li className="flex gap-2">
                    <span className="text-secondary font-bold">•</span>
                    Chlorinate well water regularly during monsoon season
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Book className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Hygiene Practices</h3>
                    <p className="text-sm text-muted-foreground">Daily habits</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-foreground">
                  <li className="flex gap-2">
                    <span className="text-success font-bold">•</span>
                    Wash hands with soap before eating and after using toilet
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success font-bold">•</span>
                    Keep food covered to prevent contamination
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success font-bold">•</span>
                    Maintain proper sanitation around living areas
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success font-bold">•</span>
                    Dispose of waste properly to prevent water source pollution
                  </li>
                </ul>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                When to Seek Medical Help
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Cholera Symptoms</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-destructive">⚠</span>
                      Severe watery diarrhea
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive">⚠</span>
                      Vomiting and nausea
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive">⚠</span>
                      Rapid dehydration
                    </li>
                    <li className="flex gap-2">
                      <span className="text-destructive">⚠</span>
                      Muscle cramps
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Typhoid Symptoms</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-warning">⚠</span>
                      Prolonged high fever
                    </li>
                    <li className="flex gap-2">
                      <span className="text-warning">⚠</span>
                      Weakness and fatigue
                    </li>
                    <li className="flex gap-2">
                      <span className="text-warning">⚠</span>
                      Stomach pain
                    </li>
                    <li className="flex gap-2">
                      <span className="text-warning">⚠</span>
                      Headache and body ache
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-card rounded-lg">
                <p className="text-sm font-medium text-foreground">
                  ⚕️ Important: Contact your local health center immediately if you experience
                  these symptoms, especially during outbreak alerts.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="languages" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Languages className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Multilingual Support
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Access health information in your preferred language
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "English",
                  "Hindi", 
                  "Assamese",
                  "Bengali",
                  "Bodo",
                  "Karbi",
                  "Mising",
                  "Nepali",
                  "Mizo",
                  "Khasi",
                  "Manipuri",
                  "Nagamese",
                ].map((lang) => (
                  <Button 
                    key={lang} 
                    variant={selectedLanguage === lang ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => {
                      setSelectedLanguage(lang);
                      toast({
                        title: "Language Changed",
                        description: `Now showing content in ${lang}`,
                      });
                    }}
                  >
                    <Volume2 className="w-4 h-4" />
                    {lang}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-success/10 rounded-xl">
                  <Award className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Health Quiz - Test Your Knowledge
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete quizzes to earn rewards and spread awareness
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">Water Safety Basics</p>
                    <Badge variant="outline">5 Questions</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn essential water safety practices
                  </p>
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={() => openQuiz("water-safety")}
                  >
                    Start Quiz
                    <Award className="w-4 h-4" />
                  </Button>
                </div>

                 <div className="p-4 bg-muted/30 rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                     <p className="font-medium text-foreground">Disease Prevention</p>
                     <Badge variant="outline">8 Questions</Badge>
                   </div>
                   <p className="text-sm text-muted-foreground mb-3">
                     Understand how to prevent water-borne diseases
                   </p>
                   <Button 
                     size="sm" 
                     className="gap-2"
                     onClick={() => openQuiz("disease-prevention")}
                   >
                     Start Quiz
                     <Award className="w-4 h-4" />
                   </Button>
                 </div>

                 <div className="p-4 bg-muted/30 rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                     <p className="font-medium text-foreground">Hygiene Practices</p>
                     <Badge variant="outline">5 Questions</Badge>
                   </div>
                   <p className="text-sm text-muted-foreground mb-3">
                     Learn proper hygiene and sanitation methods
                   </p>
                   <Button 
                     size="sm" 
                     className="gap-2"
                     onClick={() => openQuiz("hygiene-practices")}
                   >
                     Start Quiz
                     <Award className="w-4 h-4" />
                   </Button>
                 </div>

                 <div className="p-4 bg-muted/30 rounded-lg">
                   <div className="flex items-center justify-between mb-2">
                     <p className="font-medium text-foreground">Emergency Response</p>
                     <Badge variant="outline">5 Questions</Badge>
                   </div>
                   <p className="text-sm text-muted-foreground mb-3">
                     Know what to do during health emergencies
                   </p>
                   <Button 
                     size="sm" 
                     className="gap-2"
                     onClick={() => openQuiz("emergency-response")}
                   >
                     Start Quiz
                     <Award className="w-4 h-4" />
                   </Button>
                 </div>
               </div>
               
               {/* Gamified Learning Section */}
               <Card className="p-6 bg-gradient-to-br from-success/10 to-primary/5 border-success/20">
                 <div className="flex items-start gap-4 mb-6">
                   <div className="p-3 bg-success/10 rounded-xl">
                     <Gamepad2 className="w-6 h-6 text-success" />
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-foreground">
                       🎮 Learning Achievements & Rewards
                     </h3>
                     <p className="text-sm text-muted-foreground">
                       Complete quizzes to earn points, badges, and certificates
                     </p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-4 bg-card rounded-lg border border-primary/20">
                     <div className="flex items-center gap-2 mb-2">
                       <Star className="w-5 h-5 text-warning" />
                       <span className="font-medium text-foreground">Points System</span>
                     </div>
                     <p className="text-sm text-muted-foreground">
                       Earn 10 points for each correct answer
                     </p>
                   </div>

                   <div className="p-4 bg-card rounded-lg border border-success/20">
                     <div className="flex items-center gap-2 mb-2">
                       <Trophy className="w-5 h-5 text-success" />
                       <span className="font-medium text-foreground">Certificates</span>
                     </div>
                     <p className="text-sm text-muted-foreground">
                       Get official certificates for 70%+ scores
                     </p>
                   </div>

                   <div className="p-4 bg-card rounded-lg border border-accent/20">
                     <div className="flex items-center gap-2 mb-2">
                       <Target className="w-5 h-5 text-accent" />
                       <span className="font-medium text-foreground">Progress Tracking</span>
                     </div>
                     <p className="text-sm text-muted-foreground">
                       Track your learning journey
                     </p>
                   </div>
                 </div>

                 <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                   <h4 className="font-medium text-foreground mb-2">🏆 Special Features:</h4>
                   <ul className="text-sm text-muted-foreground space-y-1">
                     <li>• Download official government-style certificates</li>
                     <li>• Share your achievements on social media</li>
                     <li>• Get recognition for water safety knowledge</li>
                     <li>• Help spread awareness in your community</li>
                   </ul>
                 </div>
               </Card>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VoiceChatbot />
              <SMSReporter />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <QuizModal 
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        quizType={quizType}
      />
    </div>
  );
};

export default Awareness;
