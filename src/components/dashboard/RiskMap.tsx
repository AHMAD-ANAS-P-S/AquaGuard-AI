import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Village {
  id: string;
  name: string;
  district: string;
  risk_level: string;
  risk_score: number;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "high":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-warning text-warning-foreground";
    case "low":
      return "bg-success text-success-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const RiskMap = () => {
  const [villages, setVillages] = useState<Village[]>([]);

  useEffect(() => {
    const fetchVillages = async () => {
      const { data } = await supabase
        .from("villages")
        .select("*")
        .order("risk_score", { ascending: false });
      
      if (data) setVillages(data);
    };

    fetchVillages();

    const channel = supabase
      .channel("village_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "villages" }, () => fetchVillages())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Risk Assessment Map</h3>
          <p className="text-sm text-muted-foreground">Current disease outbreak risk by region</p>
        </div>
        
        <div className="space-y-3">
          {villages.map((village) => (
            <div
              key={village.id}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{village.name}</p>
                <p className="text-sm text-muted-foreground">Risk Score: {village.risk_score}/100</p>
              </div>
              <Badge className={getRiskColor(village.risk_level)}>
                {village.risk_level.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <span className="text-sm text-muted-foreground">High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-sm text-muted-foreground">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-sm text-muted-foreground">Low Risk</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
