import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const WaterQualityChart = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchReadings = async () => {
      const { data: readings } = await supabase
        .from("water_quality_readings")
        .select("*")
        .order("reading_timestamp", { ascending: true })
        .limit(20);

      if (readings) {
        const formatted = readings.map((r) => ({
          time: new Date(r.reading_timestamp).toLocaleTimeString(),
          pH: Number(r.ph) || 0,
          turbidity: Number(r.turbidity) || 0,
          tds: Number(r.tds) / 10 || 0,
        }));
        setData(formatted);
      }
    };

    fetchReadings();

    const channel = supabase
      .channel("readings_updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "water_quality_readings" }, () => fetchReadings())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Water Quality Trends</h3>
          <p className="text-sm text-muted-foreground">Live sensor data</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="pH" stroke="hsl(var(--chart-1))" strokeWidth={2} />
            <Line type="monotone" dataKey="turbidity" stroke="hsl(var(--chart-2))" strokeWidth={2} />
            <Line type="monotone" dataKey="tds" stroke="hsl(var(--chart-3))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
