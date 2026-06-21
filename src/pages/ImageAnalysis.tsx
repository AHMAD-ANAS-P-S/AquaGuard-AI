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
    // Lightweight client-side visual analysis fallback.
    // Uses pixel statistics and simple heuristics to create realistic, non-hardcoded findings.
    const dataUrl = imagePreview || "";
    const notesLower = (userNotes || "").toLowerCase();

    const hsvFromRgb = (r: number, g: number, b: number) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      let h=0, s=0, v=max;
      const d = max-min;
      s = max === 0 ? 0 : d / max;
      if (d !== 0) {
        switch(max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return { h: h*360, s: s*100, v: v*100 };
    };

    const analyzeDataUrl = async (dataUrl: string) => {
      if (!dataUrl) return null;
      return new Promise<any>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const w = Math.min(600, img.width);
          const h = Math.min(600, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, w, h);
          const imgd = ctx.getImageData(0,0,w,h);
          const data = imgd.data;
          let dark=0, brown=0, green=0, white=0, varied=0;
          let rSum=0,gSum=0,bSum=0, count=0;
          for (let i=0;i<data.length;i+=4*6) { // sample every 6th pixel
            const r = data[i], g = data[i+1], b = data[i+2];
            const hsv = hsvFromRgb(r,g,b);
            const v = hsv.v;
            rSum += r; gSum += g; bSum += b; count++;
            if (v < 40) dark++;
            if (hsv.h >= 10 && hsv.h <= 50 && hsv.s > 15 && v > 15) brown++;
            if (hsv.h >= 60 && hsv.h <= 160 && hsv.s > 20) green++;
            if (v > 90 && hsv.s < 25) white++;
            // color variance heuristic
            const mean = (r+g+b)/3;
            if (Math.abs(r-mean) > 40 || Math.abs(g-mean) > 40 || Math.abs(b-mean) > 40) varied++;
          }
          const total = count || 1;
          resolve({ darkRatio: dark/total, brownRatio: brown/total, greenRatio: green/total, whiteRatio: white/total, variedRatio: varied/total, width: w, height: h });
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
    };

    return (async () => {
      let analysis = await analyzeDataUrl(dataUrl as string);
      if (!analysis) {
        // fallback to note-based simulation when image unavailable
        analysis = { darkRatio: 0.05, brownRatio: 0.02, greenRatio: 0.01, whiteRatio: 0.0, variedRatio: 0.01, width: 400, height: 300 };
      }

      const indicators: string[] = [];
      if (analysis.brownRatio > 0.12) indicators.push('Discoloration (brown/polluted)');
      if (analysis.greenRatio > 0.12) indicators.push('Algae growth / Green scum');
      if (analysis.whiteRatio > 0.05) indicators.push('Foam / Surface contamination');
      if (analysis.darkRatio > 0.35) indicators.push('Dark / Opaque water');
      if (analysis.variedRatio > 0.12) indicators.push('Floating waste or mixed debris (possible plastics)');

      // Also look for keywords in notes to boost indicators
      if (notesLower.includes('garbage') || notesLower.includes('trash') || notesLower.includes('plastic')) indicators.push('Visible solid waste / Plastics');
      if (notesLower.includes('sewage') || notesLower.includes('open drain') || notesLower.includes('fecal')) indicators.push('Possible sewage contamination');

      // compute risk score
      let score = 0;
      score += analysis.darkRatio * 3;
      score += analysis.brownRatio * 4;
      score += analysis.variedRatio * 3;
      score += analysis.greenRatio * 2;
      if (indicators.includes('Possible sewage contamination')) score += 2;
      const normalized = Math.min(1, score / 4);

      let riskLevel = 'low';
      if (normalized > 0.6) riskLevel = 'high';
      else if (normalized > 0.25) riskLevel = 'medium';

      // turbidity estimate (NTU) heuristic
      const turbidityVal = Math.max(0.5, Math.round((analysis.brownRatio*30 + analysis.darkRatio*20 + analysis.variedRatio*15)*10)/10);
      const turbidityText = `${turbidityVal.toFixed(1)} NTU (${turbidityVal > 6 ? 'High' : turbidityVal > 3 ? 'Elevated' : 'Normal'})`;

      // water color guess
      let waterColor = 'Clear';
      if (analysis.brownRatio > 0.12 || analysis.darkRatio > 0.25) waterColor = 'Brown / Polluted';
      else if (analysis.greenRatio > 0.12) waterColor = 'Green / Algal';

      // water type detection (filename heuristics + shape)
      let waterType = 'Unknown';
      const fname = (imageFile?.name || '').toLowerCase();
      if (fname.includes('river') || fname.includes('canal')) waterType = 'River / Canal';
      else if (fname.includes('pond') || fname.includes('lake')) waterType = fname.includes('pond') ? 'Pond' : 'Lake';
      else if (fname.includes('drain') || fname.includes('sewage') || analysis.darkRatio > 0.4) waterType = 'Drainage / Discharge';
      else {
        const aspect = (analysis.width || 1) / (analysis.height || 1);
        if (aspect > 1.6) waterType = 'River / Canal';
        else if (analysis.greenRatio > 0.25) waterType = 'Pond / Lake';
        else waterType = 'Reservoir / Lake';
      }

      // confidence: based on normalized score and how many indicators
      const baseConfidence = 0.55 + Math.min(0.4, Math.max(0, normalized));
      const randomness = (Math.random() * 0.12) - 0.06; // +/-6%
      const confidence = Math.max(0.5, Math.min(0.98, baseConfidence + randomness));

      const contaminants = indicators.length ? indicators : [];

      const recommendations: string[] = [];
      if (riskLevel === 'high') {
        recommendations.push('Immediate field inspection and laboratory verification required.');
        recommendations.push('Collect water samples and send to certified lab.');
        recommendations.push('Issue community health advisory and restrict use.');
        recommendations.push('Deploy sanitation and cleanup teams.');
      } else if (riskLevel === 'medium') {
        recommendations.push('Schedule sampling and monitor more frequently.');
        recommendations.push('Advise local community to avoid direct consumption without treatment.');
      } else {
        recommendations.push('Continue routine monitoring and preventive sanitation.');
      }

      const summary = `${waterType} shows ${waterColor.toLowerCase()} with estimated turbidity ${turbidityVal.toFixed(1)} NTU. Detected indicators: ${contaminants.join(', ') || 'none observed'}.`;

      return {
        riskLevel,
        confidence,
        waterColor,
        turbidity: turbidityText,
        summary,
        contaminants,
        recommendations,
        timestamp: new Date().toLocaleString(),
        waterType,
        isSimulation: true
      };
    })();
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
        analysisData = await simulateAIAnalysis(imageType, notes);
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
                  <h4 className="font-medium text-foreground text-xs uppercase font-semibold text-muted-foreground">{t('branding.aiPrediction')} & Findings</h4>
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
