import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, Download, Share2, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CertificateProps {
  isOpen: boolean;
  onClose: () => void;
  quizType: string;
  score: number;
  totalQuestions: number;
  userName?: string;
}

export const Certificate = ({ isOpen, onClose, quizType, score, totalQuestions, userName = "Participant" }: CertificateProps) => {
  const { toast } = useToast();
  
  const quizTitles: Record<string, string> = {
    "water-safety": "Water Safety Basics",
    "disease-prevention": "Disease Prevention",
    "hygiene-practices": "Hygiene Practices",
    "emergency-response": "Emergency Response"
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = () => {
    // Create certificate content as a downloadable HTML file
    const certificateContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Water Safety Certificate</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f0f8ff; }
          .certificate { background: white; padding: 60px; border: 4px solid #2563eb; border-radius: 12px; text-align: center; max-width: 800px; margin: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { color: #2563eb; font-size: 36px; font-weight: bold; margin-bottom: 20px; }
          .title { font-size: 28px; color: #1e40af; margin: 20px 0; }
          .name { font-size: 32px; color: #059669; font-weight: bold; margin: 30px 0; text-decoration: underline; }
          .completion { font-size: 18px; margin: 20px 0; line-height: 1.6; }
          .score { font-size: 24px; color: #dc2626; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 40px; font-size: 14px; color: #666; }
          .seal { display: inline-block; width: 80px; height: 80px; border: 3px solid #2563eb; border-radius: 50%; line-height: 74px; font-weight: bold; color: #2563eb; margin: 20px; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">🏛️ CERTIFICATE OF COMPLETION</div>
          <div class="seal">VERIFIED</div>
          <div class="title">Water-Borne Disease Awareness Program</div>
          <div style="font-size: 18px; margin: 30px 0;">This is to certify that</div>
          <div class="name">${userName}</div>
          <div class="completion">
            has successfully completed the <strong>${quizTitles[quizType] || quizType}</strong> assessment 
            and demonstrated comprehensive understanding of water safety practices and disease prevention measures.
          </div>
          <div class="score">Score Achieved: ${score}/${totalQuestions} (${Math.round((score/totalQuestions)*100)}%)</div>
          <div style="margin: 40px 0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="border-top: 2px solid #333; padding-top: 10px; margin-top: 40px;">
                <strong>Dr. Health Officer</strong><br>
                <span style="font-size: 14px;">Public Health Department</span>
              </div>
            </div>
            <div>
              <div style="border-top: 2px solid #333; padding-top: 10px; margin-top: 40px;">
                <strong>${getCurrentDate()}</strong><br>
                <span style="font-size: 14px;">Date of Completion</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p><strong>Government of Assam - Health & Family Welfare Department</strong></p>
            <p>This certificate validates completion of essential water safety and disease prevention training.</p>
            <p style="font-size: 12px; margin-top: 20px;">Certificate ID: WSC-${Date.now()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([certificateContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Water_Safety_Certificate_${userName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Certificate Downloaded",
      description: "Your certificate has been saved to your device",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Water Safety Certificate',
        text: `I just completed the ${quizTitles[quizType]} quiz with a score of ${score}/${totalQuestions}!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`I just completed the ${quizTitles[quizType]} quiz with a score of ${score}/${totalQuestions}! 🏆`);
      toast({
        title: "Copied to Clipboard",
        description: "Share text copied to clipboard",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Award className="w-6 h-6 text-primary" />
            Congratulations! Certificate Earned
          </DialogTitle>
        </DialogHeader>

        <Card className="p-8 bg-gradient-to-br from-primary/5 to-success/5 border-primary/20">
          <div className="text-center space-y-6">
            {/* Certificate Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-primary">🏛️ CERTIFICATE OF COMPLETION</h1>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary text-primary font-bold text-sm">
                VERIFIED
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Water-Borne Disease Awareness Program
              </h2>
              
              <div className="text-lg text-muted-foreground">
                This is to certify that
              </div>
              
              <div className="text-3xl font-bold text-success underline decoration-2">
                {userName}
              </div>
              
              <div className="text-base leading-relaxed text-foreground max-w-2xl mx-auto">
                has successfully completed the <strong>{quizTitles[quizType] || quizType}</strong> assessment 
                and demonstrated comprehensive understanding of water safety practices and disease prevention measures.
              </div>
              
              <div className="flex items-center justify-center gap-2 text-xl font-semibold text-destructive">
                <CheckCircle className="w-6 h-6" />
                Score Achieved: {score}/{totalQuestions} ({Math.round((score/totalQuestions)*100)}%)
              </div>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t">
              <div className="text-center">
                <div className="border-t-2 border-foreground pt-2 inline-block">
                  <div className="font-semibold">Dr. Health Officer</div>
                  <div className="text-sm text-muted-foreground">Public Health Department</div>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-foreground pt-2 inline-block">
                  <div className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {getCurrentDate()}
                  </div>
                  <div className="text-sm text-muted-foreground">Date of Completion</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t space-y-2">
              <div className="font-semibold text-foreground">
                Government of Assam - Health & Family Welfare Department
              </div>
              <div className="text-sm text-muted-foreground">
                This certificate validates completion of essential water safety and disease prevention training.
              </div>
              <div className="text-xs text-muted-foreground">
                Certificate ID: WSC-{Date.now()}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleDownload} className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Download Certificate
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
            <Share2 className="w-4 h-4" />
            Share Achievement
          </Button>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};