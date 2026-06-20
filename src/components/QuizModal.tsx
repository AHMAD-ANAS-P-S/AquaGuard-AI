import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, X, Award, Star, Trophy, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Certificate } from "./Certificate";

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const quizzes: Record<string, Question[]> = {
  "water-safety": [
    {
      question: "How long should water be boiled to make it safe?",
      options: ["5 minutes", "10 minutes", "20 minutes", "30 minutes"],
      correct: 2
    },
    {
      question: "What is the ideal pH range for drinking water?",
      options: ["4-5", "6.5-8.5", "9-10", "11-12"],
      correct: 1
    },
    {
      question: "Which of these indicates contaminated water?",
      options: ["Clear water", "Cloudy water", "Sweet smell", "None"],
      correct: 1
    },
    {
      question: "When should you chlorinate well water?",
      options: ["Never", "Only in winter", "During monsoon", "Daily"],
      correct: 2
    },
    {
      question: "What should water storage containers be?",
      options: ["Open", "Covered", "Colored", "Metal only"],
      correct: 1
    },
  ],
  "disease-prevention": [
    {
      question: "Main symptom of cholera?",
      options: ["Cough", "Fever", "Severe watery diarrhea", "Headache"],
      correct: 2
    },
    {
      question: "When should hands be washed?",
      options: ["Before eating", "After toilet", "Both A and B", "Never"],
      correct: 2
    },
    {
      question: "Typhoid is caused by?",
      options: ["Virus", "Bacteria", "Fungus", "Parasite"],
      correct: 1
    },
    {
      question: "Best way to prevent waterborne diseases?",
      options: ["Drink untreated water", "Boil water", "Add sugar", "Use dirty containers"],
      correct: 1
    },
    {
      question: "Signs of dehydration include?",
      options: ["Dry mouth", "Dark urine", "Fatigue", "All of these"],
      correct: 3
    },
    {
      question: "What attracts disease-carrying insects?",
      options: ["Clean water", "Open garbage", "Sunlight", "Fresh air"],
      correct: 1
    },
    {
      question: "How to dispose waste properly?",
      options: ["Throw in water source", "Burn everything", "Use covered bins", "Bury anywhere"],
      correct: 2
    },
    {
      question: "When to seek medical help?",
      options: ["After 1 week", "Immediately if symptoms appear", "Never", "Only on weekends"],
      correct: 1
    },
  ],
  "hygiene-practices": [
    {
      question: "How long should you wash your hands?",
      options: ["5 seconds", "10 seconds", "20 seconds", "1 minute"],
      correct: 2
    },
    {
      question: "What temperature water is best for handwashing?",
      options: ["Cold water", "Warm water", "Hot water", "Temperature doesn't matter"],
      correct: 1
    },
    {
      question: "When is hand sanitizer most effective?",
      options: ["When hands are visibly dirty", "When soap is unavailable", "Instead of handwashing", "Never"],
      correct: 1
    },
    {
      question: "Which surfaces should be cleaned regularly?",
      options: ["Only kitchen counters", "Only bathroom fixtures", "High-touch surfaces", "Only floors"],
      correct: 2
    },
    {
      question: "How should food be stored to prevent contamination?",
      options: ["Open containers", "Covered containers", "On the floor", "Mixed together"],
      correct: 1
    },
  ],
  "emergency-response": [
    {
      question: "First step when someone has diarrhea?",
      options: ["Give medicine", "Provide ORS", "Wait and watch", "Give solid food"],
      correct: 1
    },
    {
      question: "Signs that require immediate medical attention?",
      options: ["Mild stomach ache", "Severe dehydration", "Minor headache", "Slight fever"],
      correct: 1
    },
    {
      question: "How to prepare ORS at home?",
      options: ["Only sugar + water", "Only salt + water", "Salt + sugar + clean water", "Any liquid"],
      correct: 2
    },
    {
      question: "What to do during a water contamination alert?",
      options: ["Continue normal usage", "Boil all water", "Ignore the alert", "Use more water"],
      correct: 1
    },
    {
      question: "Emergency contact for health issues?",
      options: ["Local police", "Fire department", "Health center/108", "Municipal office"],
      correct: 2
    },
  ],
};

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizType: string;
}

export const QuizModal = ({ isOpen, onClose, quizType }: QuizModalProps) => {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const questions = quizzes[quizType] || [];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const passingScore = Math.ceil(questions.length * 0.7); // 70% to pass
  const hasPassedQuiz = score >= passingScore;

  const handleAnswer = (index: number) => {
    if (answered) return;
    
    setSelectedAnswer(index);
    setAnswered(true);
    
    if (index === questions[currentQuestion].correct) {
      setScore(score + 1);
      setEarnedPoints(prev => prev + 10); // 10 points per correct answer
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setAnswered(false);
      } else {
        setShowResult(true);
        
        // Show success toast for passed quiz
        if (score >= passingScore) {
          setTimeout(() => {
            toast({
              title: "🎉 Congratulations!",
              description: `You've earned ${earnedPoints} points and passed the quiz!`,
            });
          }, 500);
        }
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setShowCertificate(false);
    setSelectedAnswer(null);
    setAnswered(false);
    setEarnedPoints(0);
  };

  const handleCertificate = () => {
    setShowCertificate(true);
  };

  const handleClose = () => {
    resetQuiz();
    onClose();
  };

  if (questions.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Health Knowledge Quiz
          </DialogTitle>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>Score: {score}/{questions.length}</span>
              </div>
              <Progress value={progress} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                {questions[currentQuestion].question}
              </h3>

              <div className="space-y-2">
                {questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant={
                      answered
                        ? index === questions[currentQuestion].correct
                          ? "default"
                          : selectedAnswer === index
                          ? "destructive"
                          : "outline"
                        : "outline"
                    }
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleAnswer(index)}
                    disabled={answered}
                  >
                    <span className="flex-1">{option}</span>
                    {answered && index === questions[currentQuestion].correct && (
                      <Check className="w-5 h-5 ml-2" />
                    )}
                    {answered && selectedAnswer === index && index !== questions[currentQuestion].correct && (
                      <X className="w-5 h-5 ml-2" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              {hasPassedQuiz ? (
                <Trophy className="w-10 h-10 text-success" />
              ) : (
                <Target className="w-10 h-10 text-warning" />
              )}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Quiz Complete!
              </h3>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {score}/{questions.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-success">
                    {earnedPoints}
                  </p>
                  <p className="text-sm text-muted-foreground">Points</p>
                </div>
              </div>

              <div className="space-y-2">
                {hasPassedQuiz && (
                  <Badge variant="default" className="gap-1 mb-2">
                    <Star className="w-3 h-3" />
                    Passed!
                  </Badge>
                )}
                
                <p className="text-muted-foreground">
                  {score === questions.length
                    ? "🏆 Perfect score! You're a water safety expert!"
                    : hasPassedQuiz
                    ? "🎉 Great job! You've passed the assessment!"
                    : `📚 Need ${passingScore - score} more correct to pass. Keep learning!`}
                </p>
                
                {hasPassedQuiz && (
                  <p className="text-sm text-success font-medium">
                    ✅ You're eligible for a government certificate!
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              {hasPassedQuiz && (
                <Button onClick={handleCertificate} className="flex-1 gap-2 bg-success hover:bg-success/90">
                  <Award className="w-4 h-4" />
                  Get Certificate
                </Button>
              )}
              <Button onClick={resetQuiz} variant="outline" className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}

        <Certificate 
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          quizType={quizType}
          score={score}
          totalQuestions={questions.length}
          userName="Health Learner"
        />
      </DialogContent>
    </Dialog>
  );
};
