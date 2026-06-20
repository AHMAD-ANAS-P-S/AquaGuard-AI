import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Droplet, AlertTriangle, Users, Activity, CloudRain } from "lucide-react";
import { WaterQualityChart } from "@/components/dashboard/WaterQualityChart";
import { RiskMap } from "@/components/dashboard/RiskMap";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { HealthStats } from "@/components/dashboard/HealthStats";
import { RiskIndexCard } from "@/components/RiskIndexCard";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeSensors: 0,
    activeAlerts: 0,
    communitiesMonitored: 0,
    healthReports: 0,
  });
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    const loadVillages = async () => {
      const { data } = await supabase.from("villages").select("id, name").order("name");
      if (data && data.length > 0) {
        setVillages(data);
        setSelectedVillage(data[0].id);
      }
    };
    
    loadVillages();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const [villages, alerts, reports, readings] = await Promise.all([
        supabase.from("villages").select("id", { count: "exact" }),
        supabase.from("alerts").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("health_reports").select("id", { count: "exact" }),
        supabase.from("water_quality_readings").select("sensor_id").limit(1000),
      ]);

      const uniqueSensors = new Set(readings.data?.map((r) => r.sensor_id).filter(Boolean)).size;

      setStats({
        activeSensors: uniqueSensors || 0,
        activeAlerts: alerts.count || 0,
        communitiesMonitored: villages.count || 0,
        healthReports: reports.count || 0,
      });
    };

    fetchStats();

    const channel = supabase
      .channel("dashboard_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "health_reports" }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:pl-72 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              AquaGuard AI Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time water quality monitoring & disease surveillance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CloudRain className="w-5 h-5 text-primary" />
            <Select value={selectedVillage} onValueChange={setSelectedVillage}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select village" />
              </SelectTrigger>
              <SelectContent>
                {villages.map((village) => (
                  <SelectItem key={village.id} value={village.id}>
                    {village.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sensors</p>
                <h3 className="text-2xl font-bold text-primary mt-1">{stats.activeSensors}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Droplet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <h3 className="text-2xl font-bold text-destructive mt-1">{stats.activeAlerts}</h3>
              </div>
              <div className="p-3 bg-destructive/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Communities</p>
                <h3 className="text-2xl font-bold text-secondary mt-1">{stats.communitiesMonitored}</h3>
              </div>
              <div className="p-3 bg-secondary/10 rounded-xl">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Reports</p>
                <h3 className="text-2xl font-bold text-success mt-1">{stats.healthReports}</h3>
              </div>
              <div className="p-3 bg-success/10 rounded-xl">
                <Activity className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>
        </div>

        {selectedVillage && (
          <RiskIndexCard villageId={selectedVillage} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskMap />
          <WaterQualityChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentAlerts />
          <HealthStats />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
