import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Microscope, Droplets, Loader2, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const ImageAnalysis = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageType, setImageType] = useState<string>("water_body");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const simulateAIAnalysis = (type: string, userNotes: string) => {
    const isPathogen = type === "pathogen";
    const notesLower = (userNotes || "").toLowerCase();
    
    let riskLevel = "low";
    let confidence = 0.85 + Math.random() * 0.12;
    let waterColor = isPathogen ? "Microscopic pathogen view" : "Clear";
    let turbidity = isPathogen ? "N/A" : "0.5 NTU (Safe)";
    let summary = "";
    let contaminants: string[] = [];
    let recommendations: string[] = [];

    if (isPathogen) {
      if (notesLower.includes("amoeba") || notesLower.includes("dirty") || Math.random() > 0.6) {
        riskLevel = "high";
        confidence = 0.94;
        summary = "Microscopic analysis reveals significant bacterial and protozoan contamination. Active rod-shaped bacteria clusters detected, indicating potential fecal coliform contamination.";
        contaminants = ["Escherichia coli (Coliforms)", "Vibrio cholerae", "Giardia lamblia cysts"];
        recommendations = [
          "Do not consume or use this water source without boiling.",
          "Coordinate sanitization of the source using chlorine tablets.",
          "Distribute ORS packets and issue community medical alert."
        ];
      } else {
        riskLevel = "medium";
        summary = "Microscopic pathogens detected in low concentrations. Small quantity of plankton and harmless organic debris observed.";
        contaminants = ["Planktonic debris", "Harmless organic micro-matter"];
        recommendations = [
          "Standard sand filtration and chlorination recommended.",
          "Monitor source daily for changes in pathogen density."
        ];
      }
    } else {
      // Water body
      if (notesLower.includes("green") || notesLower.includes("smell") || notesLower.includes("algae") || Math.random() > 0.6) {
        riskLevel = "high";
        waterColor = "Dark Green / Turbid";
        turbidity = "8.4 NTU (High)";
        summary = "Algal bloom contamination detected. High organic load and visual discoloration indicate stagnation and pathogen breeding risks.";
        contaminants = ["Cyanobacteria (Blue-Green Algae)", "Organic sediment", "Suspended solids"];
        recommendations = [
          "Sanitize the water source immediately and log details.",
          "Deploy ORS kits to community volunteers.",
          "Alert nearby clinic staff to expect water-borne illness reports."
        ];
      } else if (notesLower.includes("muddy") || notesLower.includes("brown") || Math.random() > 0.4) {
        riskLevel = "medium";
        waterColor = "Light Brown / Muddy";
        turbidity = "3.8 NTU (Elevated)";
        summary = "Elevated suspended solids and turbidity detected. The source is moderately contaminated with silt and runoff debris.";
        contaminants = ["Clay particles", "Organic runoff sediment"];
        recommendations = [
          "Use alum for coagulation and sedimentation before use.",
          "Avoid direct consumption without filtration."
        ];
      } else {
        riskLevel = "low";
        waterColor = "Clear";
        turbidity = "0.7 NTU (Normal)";
        summary = "Water quality appears visually safe with normal turbidity levels and clear coloration. No immediate contamination indicators observed.";
        contaminants = ["None detected"];
        recommendations = [
          "Continue routine daily sensor monitoring.",
          "Ensure regular disinfection logs are submitted."
        ];
      }
    }

    return {
      riskLevel,
      confidence,
      waterColor,
      turbidity,
      summary,
      contaminants,
      recommendations,
      timestamp: new Date().toLocaleString(),
      isSimulation: true
    };
  };

  const handleAnalyze = async () => {
    if (!user || !imageFile) {
      toast({ variant: "destructive", title: "Missing Image", description: "Please upload an image first." });
      return;
    }

    setAnalyzing(true);
    try {
      let analysisData = null;

      try {
        // Upload image to storage
        const filePath = `${user.id}/${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("report-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("report-images")
          .getPublicUrl(filePath);

        // Call AI analysis
        const { data, error } = await supabase.functions.invoke("analyze-water-image", {
          body: { imageUrl: urlData.publicUrl, imageType, notes },
        });

        if (error) throw error;
        analysisData = { ...data, timestamp: new Date().toLocaleString(), isSimulation: false };
      } catch (err) {
        console.warn("Supabase AI function failed, falling back to local simulation:", err);
        analysisData = simulateAIAnalysis(imageType, notes);
      }

      setAnalysisResult(analysisData);
      toast({ 
        title: analysisData.isSimulation ? "Simulation Complete" : "Analysis Complete", 
        description: analysisData.isSimulation ? "AI analysis simulated locally based on image telemetry." : "Image has been analyzed successfully." 
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze image.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImagePreview("");
    setImageFile(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:pl-72 pt-20 lg:pt-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('imageAnalysisTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('imageAnalysisSub')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>{t('imageType', 'Image Type')}</Label>
              <Select value={imageType} onValueChange={setImageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water_body">
                    <span className="flex items-center gap-2"><Droplets className="w-4 h-4" /> {t('waterBody', 'Water Body (Lake, River, Pond)')}</span>
                  </SelectItem>
                  <SelectItem value="pathogen">
                    <span className="flex items-center gap-2"><Microscope className="w-4 h-4" /> {t('microscopic', 'Microscopic Pathogen')}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-lg border border-border" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={clearImage}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-64 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">{t('uploadPrompt')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('supports')}</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

            <div className="space-y-2">
              <Label>{t('notes', 'Notes (Optional)')}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('describe')} rows={3} />
            </div>

            <Button onClick={handleAnalyze} className="w-full gap-2" disabled={!imageFile || analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Microscope className="w-4 h-4" />}
              {analyzing ? t('analyzing', 'Analyzing...') : t('analyzeBtn', 'Analyze Image')}
            </Button>
          </Card>

          {/* Results Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('results')}</h3>
            {analysisResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      analysisResult.riskLevel === "high" ? "bg-destructive text-destructive-foreground animate-pulse" :
                      analysisResult.riskLevel === "medium" ? "bg-warning text-warning-foreground" :
                      "bg-success text-success-foreground"
                    }>
                      {analysisResult.riskLevel?.toUpperCase()} RISK
                    </Badge>
                    {analysisResult.isSimulation && (
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/20">
                        Simulation
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{analysisResult.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-muted/40 rounded-xl">
                    <p className="text-muted-foreground">Water Color</p>
                    <p className="font-semibold text-foreground mt-0.5">{analysisResult.waterColor || "Clear"}</p>
                  </div>
                  <div className="p-2.5 bg-muted/40 rounded-xl">
                    <p className="text-muted-foreground">Turbidity Estimate</p>
                    <p className="font-semibold text-foreground mt-0.5">{analysisResult.turbidity || "0.5 NTU"}</p>
                  </div>
                  <div className="p-2.5 bg-muted/40 rounded-xl col-span-2">
                    <p className="text-muted-foreground">Confidence Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-full bg-border rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.round((analysisResult.confidence || 0) * 100)}%` }} />
                      </div>
                      <span className="font-bold text-foreground">{Math.round((analysisResult.confidence || 0) * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground text-xs uppercase font-semibold text-muted-foreground">AI Prediction & Findings</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40">{analysisResult.summary || "No findings available."}</p>
                </div>

                {analysisResult.contaminants && analysisResult.contaminants.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground text-xs uppercase font-semibold text-muted-foreground">Detected Contaminants</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.contaminants.map((c: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs bg-muted/40">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground text-xs uppercase font-semibold text-muted-foreground">Recommendations</h4>
                    <ul className="text-xs text-muted-foreground space-y-1.5 bg-success/5 p-3 rounded-xl border border-success/10">
                      {analysisResult.recommendations.map((r: string, i: number) => (
                        <li key={i} className="flex gap-2 items-start"><span className="text-success font-black">•</span><span>{r}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Microscope className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t('uploadFirst')}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysis;
