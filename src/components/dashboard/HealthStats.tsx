import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const HealthStats = () => {
  const [symptomData, setSymptomData] = useState<any[]>([]);

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

    if (data) {
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
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Symptom Distribution</h3>
          <p className="text-sm text-muted-foreground">Last 7 days</p>
        </div>
        {symptomData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No symptom data available
          </div>
        ) : (
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
        )}
      </div>
    </Card>
  );
};
