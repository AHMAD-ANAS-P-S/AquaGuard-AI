import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Droplet, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RiskIndexProps {
  villageId: string;
}

export const RiskIndexCard = ({ villageId }: RiskIndexProps) => {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiskIndex();
  }, [villageId]);

  const loadRiskIndex = async () => {
    try {
      const { data } = await supabase.functions.invoke('calculate-risk-index', {
        body: { villageId }
      });
      
      if (data) {
        setRiskData(data);
      }
    } catch (error) {
      console.error('Error loading risk index:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!riskData) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-success';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'high': return 'from-destructive/10 to-destructive/5 border-destructive/20';
      case 'medium': return 'from-warning/10 to-warning/5 border-warning/20';
      default: return 'from-success/10 to-success/5 border-success/20';
    }
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${getRiskBg(riskData.riskLevel)}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-8 h-8 ${getRiskColor(riskData.riskLevel)}`} />
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Health Risk Index: {riskData.riskScore}/100
              </h3>
              <p className={`text-sm font-medium uppercase ${getRiskColor(riskData.riskLevel)}`}>
                {riskData.riskLevel} RISK
              </p>
            </div>
          </div>
        </div>

        <Progress value={riskData.riskScore} className="h-3" />

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Alerts</span>
            </div>
            <p className="text-lg font-bold text-foreground">{riskData.metrics.alertRisk}/30</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Health</span>
            </div>
            <p className="text-lg font-bold text-foreground">{riskData.metrics.healthRisk}/40</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Water</span>
            </div>
            <p className="text-lg font-bold text-foreground">{riskData.metrics.waterRisk}/30</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            AI Analysis
          </h4>
          <p className="text-sm text-muted-foreground">{riskData.explanation}</p>
          
          {riskData.factors.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-foreground">Key Factors:</p>
              {riskData.factors.map((factor: string, idx: number) => (
                <p key={idx} className="text-xs text-muted-foreground">• {factor}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
