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

  const handleAnalyze = async () => {
    if (!user || !imageFile) {
      toast({ variant: "destructive", title: "Missing Image", description: "Please upload an image first." });
      return;
    }

    setAnalyzing(true);
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

      setAnalysisResult(data);
      toast({ title: "Analysis Complete", description: "Image has been analyzed successfully." });
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
              <Label>Image Type</Label>
              <Select value={imageType} onValueChange={setImageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water_body">
                    <span className="flex items-center gap-2"><Droplets className="w-4 h-4" /> Water Body (Lake, River, Pond)</span>
                  </SelectItem>
                  <SelectItem value="pathogen">
                    <span className="flex items-center gap-2"><Microscope className="w-4 h-4" /> Microscopic Pathogen</span>
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
              <Label>Notes (Optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('describe')} rows={3} />
            </div>

            <Button onClick={handleAnalyze} className="w-full gap-2" disabled={!imageFile || analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Microscope className="w-4 h-4" />}
              {analyzing ? "Analyzing..." : "Analyze Image"}
            </Button>
          </Card>

          {/* Results Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('results')}</h3>
            {analysisResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={
                    analysisResult.riskLevel === "high" ? "bg-destructive text-destructive-foreground" :
                    analysisResult.riskLevel === "medium" ? "bg-warning text-warning-foreground" :
                    "bg-success text-success-foreground"
                  }>
                    {analysisResult.riskLevel?.toUpperCase()} RISK
                  </Badge>
                  <span className="text-sm text-muted-foreground">Confidence: {Math.round((analysisResult.confidence || 0) * 100)}%</span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Findings</h4>
                  <p className="text-sm text-muted-foreground">{analysisResult.summary || "No findings available."}</p>
                </div>

                {analysisResult.contaminants && analysisResult.contaminants.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Detected Contaminants</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.contaminants.map((c: string, i: number) => (
                        <Badge key={i} variant="outline">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.recommendations && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Recommendations</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {analysisResult.recommendations.map((r: string, i: number) => (
                        <li key={i} className="flex gap-2"><span className="text-primary">•</span>{r}</li>
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
