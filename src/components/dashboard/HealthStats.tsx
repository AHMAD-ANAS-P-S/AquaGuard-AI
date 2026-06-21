import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const MOCK_SYMPTOMS = [
  { symptom: "Diarrhea", cases: 28 },
  { symptom: "Fever", cases: 19 },
  { symptom: "Vomiting", cases: 15 },
  { symptom: "Stomach Pain", cases: 12 },
  { symptom: "Nausea", cases: 8 },
  { symptom: "Dehydration", cases: 5 },
];

export const HealthStats = () => {
  const [symptomData, setSymptomData] = useState<any[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    loadSymptomStats();
  }, []);

  const loadSymptomStats = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data } = await supabase
      .from("health_reports")
      .select("symptoms, cases_count")
      .gte("created_at", weekAgo.toISOString());

    if (data && data.length > 0) {
      const symptomCounts: Record<string, number> = {};
      
      data.forEach((report) => {
        const symptoms = Array.isArray(report.symptoms) ? report.symptoms : [];
        symptoms.forEach((symptom: string) => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + (report.cases_count || 1);
        });
      });

      const chartData = Object.entries(symptomCounts)
        .map(([symptom, cases]) => ({ symptom, cases }))
        .sort((a, b) => b.cases - a.cases)
        .slice(0, 6);

      setSymptomData(chartData);
      setIsDemo(false);
    } else {
      setSymptomData(MOCK_SYMPTOMS);
      setIsDemo(true);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Symptom Distribution</h3>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          {isDemo && (
            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/20">
              Demo Data
            </Badge>
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={symptomData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="symptom" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="cases" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
      </div>
    </Card>
  );
};
