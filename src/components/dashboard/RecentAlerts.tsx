import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  message: string;
  created_at: string;
  villages: { name: string } | null;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "high":
    case "critical":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-warning text-warning-foreground";
    case "low":
      return "bg-success text-success-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const RecentAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from("alerts")
        .select(`
          *,
          villages(name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) setAlerts(data as any);
    };

    fetchAlerts();

    const channel = supabase
      .channel("alerts_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => fetchAlerts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
            <p className="text-sm text-muted-foreground">Real-time health warnings</p>
          </div>
          <Bell className="w-5 h-5 text-primary" />
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{alert.title}</p>
                  <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.villages?.name}</p>
                <p className="text-sm text-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
