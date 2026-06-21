import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Droplet, Activity, AlertTriangle, Thermometer, Waves, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import HeatmapLayer from "@/components/dashboard/HeatmapLayer";
import { db } from "@/utils/db";
import "leaflet/dist/leaflet.css";

const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface Village {
  id: string;
  name: string;
  district: string | null;
  state: string | null;
  risk_level: string | null;
  risk_score: number | null;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  predictedDisease?: string;
  districtId?: string;
}

interface VillageStats {
  sensors: number;
  cases: number;
  avgPh: number | null;
  avgTurbidity: number | null;
}

const getRiskColor = (risk: string | null) => {
  switch (risk) {
    case "high": return "bg-destructive text-destructive-foreground";
    case "medium": return "bg-warning text-warning-foreground";
    case "low": return "bg-success text-success-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getRiskHex = (risk: string | null) => {
  switch (risk) {
    case "high": return "#ef4444";
    case "medium": return "#f59e0b";
    case "low": return "#22c55e";
    default: return "#6b7280";
  }
};

const getDiseaseColor = (disease: string | null | undefined) => {
  if (!disease || disease === "None" || disease === "none") return "#22c55e"; // Safe / Green
  const d = disease.toLowerCase();
  if (d.includes("cholera")) return "#ef4444"; // Red
  if (d.includes("diarrhea") || d.includes("dysentery")) return "#f97316"; // Orange
  if (d.includes("typhoid")) return "#eab308"; // Yellow
  if (d.includes("hepatitis")) return "#a855f7"; // Purple
  return "#3b82f6"; // Other/Blue
};

const getRiskGradient = (risk: string | null) => {
  switch (risk) {
    case "high": return "from-destructive/40 to-destructive/10";
    case "medium": return "from-warning/40 to-warning/10";
    case "low": return "from-success/40 to-success/10";
    default: return "from-muted/40 to-muted/10";
  }
};

const MapView = () => {
  const { t } = useTranslation();
  const [villages, setVillages] = useState<Village[]>([]);
  const [villageStats, setVillageStats] = useState<Record<string, VillageStats>>({});
  const [selectedVillage, setSelectedVillage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVillages();

    const channel = supabase
      .channel('map_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'villages' }, () => loadVillages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_quality_readings' }, () => {
        villages.forEach(v => loadVillageStats(v.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'health_reports' }, () => {
        villages.forEach(v => loadVillageStats(v.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadVillages = async () => {
    setLoading(true);
    const data = await db.getVillages();

    if (data) {
      const mapped = data.map((v: any) => ({
        ...v,
        district: v.district || v.districts?.name || null
      }));
      // Sort by risk score
      mapped.sort((a, b) => (b.riskScore || b.risk_score || 0) - (a.riskScore || a.risk_score || 0));
      
      setVillages(mapped);
      mapped.forEach((village) => loadVillageStats(village.id));
    }
    setLoading(false);
  };

  const loadVillageStats = async (villageId: string) => {
    const { data: readingsData } = await supabase
      .from("water_quality_readings")
      .select("sensor_id, ph, turbidity")
      .eq("village_id", villageId)
      .order("reading_timestamp", { ascending: false })
      .limit(10);

    const { data: casesData } = await supabase
      .from("health_reports")
      .select("cases_count")
      .eq("village_id", villageId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const uniqueSensors = new Set(readingsData?.map((s) => s.sensor_id)).size;
    const totalCases = casesData?.reduce((sum, report) => sum + (report.cases_count || 0), 0) || 0;
    const avgPh = readingsData?.length
      ? readingsData.reduce((sum, r) => sum + (r.ph || 0), 0) / readingsData.filter(r => r.ph).length
      : null;
    const avgTurbidity = readingsData?.length
      ? readingsData.reduce((sum, r) => sum + (r.turbidity || 0), 0) / readingsData.filter(r => r.turbidity).length
      : null;

    setVillageStats((prev) => ({
      ...prev,
      [villageId]: { sensors: uniqueSensors, cases: totalCases, avgPh, avgTurbidity },
    }));
  };

  // Heatmap points: [lat, lng, intensity]
  const heatmapPoints = useMemo((): [number, number, number][] => {
    return villages
      .filter(v => v.latitude && v.longitude)
      .map(v => [v.latitude!, v.longitude!, (v.risk_score || (v as any).riskScore || 0) / 100]);
  }, [villages]);

  // Center map on Assam, India by default
  const mapCenter = useMemo((): [number, number] => {
    const validVillages = villages.filter(v => v.latitude && v.longitude);
    if (validVillages.length) {
      const avgLat = validVillages.reduce((s, v) => s + v.latitude!, 0) / validVillages.length;
      const avgLng = validVillages.reduce((s, v) => s + v.longitude!, 0) / validVillages.length;
      return [avgLat, avgLng];
    }
    return [26.2006, 92.9376]; // Assam default
  }, [villages]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:pl-72 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{t('riskMap')}</h1>
            <p className="text-muted-foreground mt-1">{t('mapDigitalTwinTitle')}</p>
          </div>
          <Button onClick={loadVillages} variant="outline" className="gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refreshSystem')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Digital Twin Map */}
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4 pb-0 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Waves className="w-5 h-5 text-primary" />
                {t('mapDigitalTwinTitle')}
              </h3>
              <div className="flex gap-2">
                <Badge className="bg-destructive text-destructive-foreground">{t('mapRedZoneBadge')}</Badge>
                <Badge className="bg-warning text-warning-foreground">{t('mapYellowZoneBadge')}</Badge>
                <Badge className="bg-success text-success-foreground">{t('mapGreenZoneBadge')}</Badge>
              </div>
            </div>
            <div className="h-[500px] md:h-[600px] relative">
              <MapContainer
                center={mapCenter}
                zoom={8}
                className="h-full w-full z-0"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HeatmapLayer points={heatmapPoints} />
                {villages.filter(v => v.latitude && v.longitude).map(village => (
                  <CircleMarker
                    key={village.id}
                    center={[village.latitude!, village.longitude!]}
                    radius={10 + (village.risk_score || (village as any).riskScore || 0) / 10}
                    pathOptions={{
                      color: getRiskHex(village.risk_level || (village as any).riskLevel),
                      fillColor: getRiskHex(village.risk_level || (village as any).riskLevel),
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedVillage(selectedVillage === village.id ? null : village.id),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[180px]">
                        <p className="font-bold text-sm">{village.name}</p>
                        <p className="text-xs text-muted-foreground">{village.district}, {village.state}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                             <span>{t('mapRiskScore')}</span>
                             <span className="font-semibold">{village.risk_score || (village as any).riskScore}/100</span>
                           </div>
                           {village.predictedDisease && village.predictedDisease !== "None" && (
                             <div className="flex justify-between text-destructive font-semibold">
                               <span>{t('mapDisease')}</span>
                               <span>{village.predictedDisease}</span>
                             </div>
                           )}
                           <div className="flex justify-between">
                             <span>{t('mapActiveSensors')}</span>
                             <span>{villageStats[village.id]?.sensors || 0}</span>
                           </div>
                           <div className="flex justify-between">
                             <span>{t('mapCases7d')}</span>
                             <span>{villageStats[village.id]?.cases || 0}</span>
                           </div>
                          {villageStats[village.id]?.avgPh != null && (
                             <div className="flex justify-between">
                               <span>{t('mapAvgPh')}</span>
                               <span>{villageStats[village.id]?.avgPh?.toFixed(1)}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-destructive shadow-sm shadow-destructive/50" />
                <span className="text-sm text-muted-foreground">{t('mapRedZone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-warning shadow-sm shadow-warning/50" />
                <span className="text-sm text-muted-foreground">{t('mapYellowZone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success shadow-sm shadow-success/50" />
                <span className="text-sm text-muted-foreground">{t('mapGreenZone')}</span>
              </div>
            </div>
          </Card>

          {/* Village List */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {t('mapMonitoredLocs')} ({villages.length})
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : villages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('mapNoLocs')}</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {villages.map((village) => (
                    <div
                      key={village.id}
                      onClick={() => setSelectedVillage(selectedVillage === village.id ? null : village.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        selectedVillage === village.id
                          ? 'border-primary bg-primary/5'
                          : `border-border hover:border-primary/30 bg-gradient-to-r ${getRiskGradient(village.risk_level)}`
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-semibold text-foreground">{village.name}</p>
                        <Badge className={getRiskColor(village.risk_level || (village as any).riskLevel)}>
                          {(village.risk_level || (village as any).riskLevel)?.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                           <Droplet className="w-4 h-4 text-primary" />
                           {villageStats[village.id]?.sensors || 0} {t('mapSensorsText')}
                         </div>
                         <div className="flex items-center gap-2 text-muted-foreground">
                           <AlertTriangle className="w-4 h-4 text-warning" />
                           {villageStats[village.id]?.cases || 0} {t('mapCasesText')}
                         </div>
                        {villageStats[village.id]?.avgPh != null && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Thermometer className="w-4 h-4 text-secondary" />
                            pH {villageStats[village.id]?.avgPh?.toFixed(1)}
                          </div>
                        )}
                        {village.population && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {village.population.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{t('mapRiskScore')}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  (village.risk_level || (village as any).riskLevel) === 'high' ? 'bg-destructive' :
                                  (village.risk_level || (village as any).riskLevel) === 'medium' ? 'bg-warning' : 'bg-success'
                                }`}
                                style={{ width: `${village.risk_score || (village as any).riskScore || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold w-8">{village.risk_score || (village as any).riskScore || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
