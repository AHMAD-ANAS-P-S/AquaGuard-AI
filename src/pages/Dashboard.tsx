import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { db } from "@/utils/db";

import { 
  Droplet, AlertTriangle, Users, Activity, CloudRain, Shield, Award, 
  CheckCircle, Clock, RefreshCw, Bot, Send, ShieldAlert, BarChart2, 
  TrendingUp, Download, Eye, Heart, Layers, Database, AlertOctagon, 
  HelpCircle, Thermometer, Info, Check, Plus, ShieldCheck, MapPin, Trophy, X
} from "lucide-react";

import { WaterQualityChart } from "@/components/dashboard/WaterQualityChart";
import { RiskMap } from "@/components/dashboard/RiskMap";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { HealthStats } from "@/components/dashboard/HealthStats";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Dashboard = () => {
  const { toast } = useToast();
  const { roles, isOfficial, isCommunity } = useUserRole();

  // Selected district & village states
  const [selectedDistrict, setSelectedDistrict] = useState<string>("d1"); // d1 = Dibrugarh
  const [selectedVillage, setSelectedVillage] = useState<string>("v1"); // v1 = Dibrugarh Town
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [allVillages, setAllVillages] = useState<any[]>([]);

  // Simulation, AI and tracking states
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [symptomClusters, setSymptomClusters] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [kpi, setKpi] = useState<any>(null);

  // Village Profile Modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileVillage, setProfileVillage] = useState<any>(null);

  // Government action center checkboxes
  const [actionsChecked, setActionsChecked] = useState<Record<string, boolean>>({
    alert: true,
    medical: false,
    awareness: false,
    ors: false,
    testing: true
  });

  // Presentation Mode Toggle for Judges
  const [showJudgeKPI, setShowJudgeKPI] = useState(true);

  // Active Tab for health officials / clinic staff
  const [activeTab, setActiveTab] = useState<"surveillance" | "digitalTwin" | "resources" | "timeline" | "approvals">("surveillance");

  // Load database and mock state
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const districtsData = await db.getDistricts();
    const allVillagesData = await db.getVillages();
    const predsData = await db.getPredictions();
    const resourcesData = await db.getResources();
    const interventionsData = await db.getInterventions();
    const sensorsData = await db.getSensors();
    const clustersData = await db.getSymptomClusters();
    const pendingData = await db.getPendingReports();
    const kpiData = db.getImpactKPIs();

    setDistricts(districtsData);
    setAllVillages(allVillagesData);
    setPredictions(predsData);
    setResources(resourcesData);
    setInterventions(interventionsData);
    setSensors(sensorsData);
    setSymptomClusters(clustersData);
    setPendingReports(pendingData);
    setKpi(kpiData);

    // Filter villages for the selected district
    const filtered = allVillagesData.filter(v => v.districtId === selectedDistrict);
    setVillages(filtered);
    if (filtered.length > 0) {
      setSelectedVillage(filtered[0].id);
    }
  };

  // Trigger when district changes
  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    const filtered = allVillages.filter(v => v.districtId === val);
    setVillages(filtered);
    if (filtered.length > 0) {
      setSelectedVillage(filtered[0].id);
    }
  };

  // Open Village Profile Modal
  const openVillageProfile = (vId: string) => {
    const v = allVillages.find(x => x.id === vId);
    if (v) {
      setProfileVillage(v);
      setIsProfileOpen(true);
    }
  };

  // Outbreak Simulation Trigger
  const runOutbreakSimulation = (applyIntervention: boolean) => {
    const result = db.simulateIntervention(selectedVillage, applyIntervention);
    setSimulationResult({
      applied: applyIntervention,
      ...result
    });
    toast({
      title: "🔮 Outbreak Simulation Completed",
      description: `Predicted outcomes mapped successfully for selected parameters.`,
    });
  };

  // Approve report log
  const handleApproveReport = (id: string) => {
    const updated = db.approveReport(id);
    setPendingReports([...updated]);
    loadAllData();
    toast({
      title: "✅ Report Approved",
      description: "ASHA report successfully validated and ingested into the Outbreak Prediction Engine.",
    });
  };

  // Reject report log
  const handleRejectReport = (id: string) => {
    const updated = db.rejectReport(id);
    setPendingReports([...updated]);
    toast({
      title: "❌ Report Rejected",
      description: "ASHA report marked as invalid.",
    });
  };

  // Resource recommendation calculations
  const getResourceRecommendations = (riskScore: number) => {
    if (riskScore >= 80) {
      return { doctors: 2, nurses: 5, ORS: 200, tankers: 1 };
    } else if (riskScore >= 45) {
      return { doctors: 1, nurses: 2, ORS: 100, tankers: 0 };
    }
    return { doctors: 0, nurses: 1, ORS: 30, tankers: 0 };
  };

  const selectedVillageData = allVillages.find(v => v.id === selectedVillage) || allVillages[0];
  const activeAlertsCount = allVillages.reduce((acc, v) => acc + (v.alerts || 0), 0);
  const totalCasesCount = allVillages.reduce((acc, v) => acc + (v.cases || 0), 0);
  const activeSensorsCount = sensors.filter(s => s.status === "Online").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:pl-72 pt-20 lg:pt-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP BAR / HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                AquaGuard <span className="text-primary font-black">AI Dashboard</span>
              </h1>
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1 animate-pulse">
                <Activity className="h-3 w-3" /> SIH PORTAL
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Smart Community Health Monitoring & Early Warning System for Water-Borne Diseases
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={showJudgeKPI ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowJudgeKPI(!showJudgeKPI)}
              className="gap-2 border-primary/30"
            >
              <Award className="h-4 w-4" /> 
              {showJudgeKPI ? "Hide Impact Panel" : "Show Impact Panel (Judges)"}
            </Button>
            <Button variant="outline" size="sm" onClick={loadAllData} className="gap-1">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* JUDGES' IMPACT KPI DASHBOARD */}
        {showJudgeKPI && kpi && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/5 border border-primary/20 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Trophy className="h-28 w-28 text-primary" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-primary tracking-wide uppercase">SIH Evaluation Panel — Real-Time Platform Impact</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-border/40">
                  <p className="text-3xl font-black text-primary">{kpi.villagesMonitored}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">Villages Monitored</p>
                </div>
                <div className="text-center p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-border/40">
                  <p className="text-3xl font-black text-primary">1.2L+</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">Citizens Covered</p>
                </div>
                <div className="text-center p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-border/40">
                  <p className="text-3xl font-black text-primary">{kpi.reportsCollected}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">Reports Collected</p>
                </div>
                <div className="text-center p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-border/40">
                  <p className="text-3xl font-black text-primary">{kpi.alertsGenerated}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">Alerts Generated</p>
                </div>
                <div className="text-center p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-border/40">
                  <p className="text-3xl font-black text-green-500">{kpi.outbreaksPrevented}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">Outbreaks Prevented</p>
                </div>
                <div className="text-center p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-border/40">
                  <p className="text-3xl font-black text-yellow-500">{kpi.responseTimeReduction}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1">Faster Response</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* FILTERS & LOCATION SELECTORS */}
        <Card className="p-4 border border-border/60 bg-card/40 backdrop-blur-md rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Select District:</span>
            </div>
            <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Select Village:</span>
            </div>
            <Select value={selectedVillage} onValueChange={setSelectedVillage}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl">
                <SelectValue placeholder="Village" />
              </SelectTrigger>
              <SelectContent>
                {villages.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVillageData && (
            <Button size="sm" variant="outline" onClick={() => openVillageProfile(selectedVillage)} className="gap-1 border-primary/20 hover:border-primary">
              <Eye className="h-4 w-4" /> View Village Profile
            </Button>
          )}
        </Card>

        {/* CORE STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Active Sensors</p>
                <h3 className="text-2xl font-bold text-primary mt-1">{activeSensorsCount} / {sensors.length}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Droplet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 rounded-2xl hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Active Alerts</p>
                <h3 className="text-2xl font-bold text-destructive mt-1">{activeAlertsCount}</h3>
              </div>
              <div className="p-3 bg-destructive/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-2xl hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Monitored Villages</p>
                <h3 className="text-2xl font-bold text-secondary mt-1">{allVillages.length}</h3>
              </div>
              <div className="p-3 bg-secondary/10 rounded-xl">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-2xl hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Cases Logged</p>
                <h3 className="text-2xl font-bold text-success mt-1">{totalCasesCount}</h3>
              </div>
              <div className="p-3 bg-success/10 rounded-xl">
                <Activity className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>
        </div>

        {/* ROLE TABS FOR UNIFIED RBAC DASHBOARD */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("surveillance")}
            className={`rounded-none border-b-2 py-3 px-4 text-xs font-semibold ${activeTab === 'surveillance' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground'}`}
          >
            📊 Surveillance Overview
          </Button>

          {isOfficial() && (
            <>
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("digitalTwin")}
                className={`rounded-none border-b-2 py-3 px-4 text-xs font-semibold ${activeTab === 'digitalTwin' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground'}`}
              >
                📡 Digital Twin Village Intelligence
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("resources")}
                className={`rounded-none border-b-2 py-3 px-4 text-xs font-semibold ${activeTab === 'resources' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground'}`}
              >
                💊 Resource Recommendation & Interventions
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("approvals")}
                className={`rounded-none border-b-2 py-3 px-4 text-xs font-semibold ${activeTab === 'approvals' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground'}`}
              >
                📥 ASHA Reports Verification ({pendingReports.filter(r=>r.status==='Pending').length})
              </Button>
            </>
          )}

          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("timeline")}
            className={`rounded-none border-b-2 py-3 px-4 text-xs font-semibold ${activeTab === 'timeline' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground'}`}
          >
            ⏰ Outbreak Warning Timeline
          </Button>
        </div>

        {/* TAB 1: SURVEILLANCE OVERVIEW */}
        {activeTab === "surveillance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* GIS Map & Trend */}
              <div className="lg:col-span-2 space-y-6">
                <RiskMap />
                <WaterQualityChart />
              </div>

              {/* Sidebar Modules: Explainability, Recommendations, Actions */}
              <div className="space-y-6">
                {/* AI PREDICTION EXPLAINABILITY PANEL */}
                {selectedVillageData && (
                  <Card className="p-5 border border-primary/20 bg-gradient-to-br from-card to-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-bold text-foreground">AI Prediction Explainability</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-background/55 p-3 rounded-xl border border-border/30">
                        <div>
                          <p className="text-xs text-muted-foreground">Village Profile</p>
                          <p className="text-sm font-semibold text-foreground">{selectedVillageData.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Risk Level</p>
                          <Badge className={selectedVillageData.riskLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
                            {selectedVillageData.riskLevel?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Why this assessment?</p>
                        <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-xs text-foreground/80 leading-relaxed">
                          {selectedVillageData.riskLevel === 'high' ? (
                            <ul className="space-y-1 list-disc list-inside">
                              <li>+ {selectedVillageData.cases} cases flagged by clinic staff</li>
                              <li>+ Turbidity above safe limits (monitored via IoT)</li>
                              <li>+ Seasonal heavy rainfall pattern matched</li>
                              <li>+ High pathogen density detected via strip analysis</li>
                            </ul>
                          ) : (
                            <ul className="space-y-1 list-disc list-inside">
                              <li>+ Stable symptom counts in community</li>
                              <li>+ Water sensors reporting safe pH (6.5-8.5)</li>
                              <li>+ Regular chlorine disinfection logs uploaded</li>
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Model Confidence: {selectedVillageData.predictionScore}%</span>
                        <span>Water: {selectedVillageData.riskLevel === 'high' ? 'Poor' : 'Good'}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* AI RESOURCE RECOMMENDATION ENGINE */}
                {selectedVillageData && (
                  <Card className="p-5 border border-primary/20 bg-gradient-to-br from-card to-secondary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="h-5 w-5 text-secondary" />
                      <h3 className="text-base font-bold text-foreground font-semibold">AI Resource Recommendation</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Recommended contingency deployment for <strong>{selectedVillageData.name}</strong> to mitigate outbreak likelihood:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted/40 rounded-xl border border-border/40 text-center">
                          <p className="text-lg font-bold text-secondary">{getResourceRecommendations(selectedVillageData.riskScore).doctors}</p>
                          <p className="text-[10px] text-muted-foreground">Doctors</p>
                        </div>
                        <div className="p-2 bg-muted/40 rounded-xl border border-border/40 text-center">
                          <p className="text-lg font-bold text-secondary">{getResourceRecommendations(selectedVillageData.riskScore).nurses}</p>
                          <p className="text-[10px] text-muted-foreground">Nurses</p>
                        </div>
                        <div className="p-2 bg-muted/40 rounded-xl border border-border/40 text-center">
                          <p className="text-lg font-bold text-secondary">{getResourceRecommendations(selectedVillageData.riskScore).ORS}</p>
                          <p className="text-[10px] text-muted-foreground">ORS Kits</p>
                        </div>
                        <div className="p-2 bg-muted/40 rounded-xl border border-border/40 text-center">
                          <p className="text-lg font-bold text-secondary">{getResourceRecommendations(selectedVillageData.riskScore).tankers}</p>
                          <p className="text-[10px] text-muted-foreground">Water Tanker</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* GOVERNMENT ACTION CENTER */}
                {isOfficial() && selectedVillageData && (
                  <Card className="p-5 border border-primary/20 bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-bold text-foreground">Government Action Center</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Intervention Checklist for {selectedVillageData.name}</p>
                    <div className="space-y-2">
                      {[
                        { key: "alert", label: "Issue Water Contamination Alert" },
                        { key: "medical", label: "Deploy Emergency Medical Team" },
                        { key: "awareness", label: "Trigger ASHA Awareness Campaigns" },
                        { key: "ors", label: "Distribute Free ORS & Medicine Kits" },
                        { key: "testing", label: "Sanitize & Chlorinate Water Sources" },
                      ].map((item) => (
                        <div 
                          key={item.key} 
                          onClick={() => setActionsChecked(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/40 cursor-pointer border border-transparent hover:border-border/40 transition-colors"
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center ${actionsChecked[item.key] ? 'bg-primary border-primary text-white' : 'border-muted-foreground/40'}`}>
                            {actionsChecked[item.key] && <Check className="h-3 w-3" />}
                          </div>
                          <span className={`text-xs ${actionsChecked[item.key] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* SYMPTOM CLUSTER AI & SENSOR STATUS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Symptom Cluster */}
              <Card className="p-5">
                <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Symptom Cluster Detection AI
                </h3>
                <div className="space-y-3">
                  {symptomClusters.map((c) => (
                    <div key={c.id} className="p-3 bg-muted/20 border border-border/40 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{c.village}</p>
                          <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/20">{c.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Cases: {c.details}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-primary/20 text-primary border-primary/20 text-xs">{c.pattern}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Sensor Health Monitoring */}
              <Card className="p-5">
                <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Sensor Health Monitoring
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sensors.map((s) => (
                    <div key={s.id} className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Batt: {s.battery}</p>
                      </div>
                      <Badge className={
                        s.status === 'Online' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                        s.status === 'Low Battery' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                        'bg-red-500/20 text-red-400 border-red-500/20'
                      }>
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* RECENT ALERTS & STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentAlerts />
              <HealthStats />
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL TWIN VILLAGE INTELLIGENCE */}
        {activeTab === "digitalTwin" && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Digital Twin — Village Risk Status</h2>
                <p className="text-xs text-muted-foreground">List of all villages and their real-time telemetry risk ratings</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground border border-border/40 rounded-2xl">
                <thead className="text-xs text-foreground uppercase bg-muted/40 font-semibold border-b border-border/40">
                  <tr>
                    <th scope="col" className="px-4 py-3">Village</th>
                    <th scope="col" className="px-4 py-3">Population</th>
                    <th scope="col" className="px-4 py-3">Water Sources</th>
                    <th scope="col" className="px-4 py-3">Current Cases</th>
                    <th scope="col" className="px-4 py-3">Risk Score</th>
                    <th scope="col" className="px-4 py-3">Telemetry Status</th>
                    <th scope="col" className="px-4 py-3">Outbreak Prob.</th>
                    <th scope="col" className="px-4 py-3">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {allVillages.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/10">
                      <td className="px-4 py-3 font-semibold text-foreground">{v.name}</td>
                      <td className="px-4 py-3">{v.population}</td>
                      <td className="px-4 py-3">{v.waterSources} ({v.mainWaterSource?.split(" ")[0]})</td>
                      <td className="px-4 py-3">{v.cases} cases</td>
                      <td className="px-4 py-3 font-bold text-foreground">{v.riskScore}/100</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          v.riskLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                          v.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                          'bg-green-500/20 text-green-400 border-green-500/20'
                        }>
                          {v.riskLevel === 'high' ? 'RED ZONE' : v.riskLevel === 'medium' ? 'YELLOW ZONE' : 'GREEN ZONE'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground font-bold">{v.predictionScore}%</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => openVillageProfile(v.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: RESOURCE ALLOCATION & INTERVENTIONS */}
        {activeTab === "resources" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Resources list */}
            <Card className="p-5 lg:col-span-1 space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Medicines & Supplies
                </h3>
                <p className="text-xs text-muted-foreground">Adjust allocated stocks during emergencies</p>
              </div>

              <div className="space-y-3">
                {resources.map((r) => (
                  <div key={r.id} className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-foreground">{r.type}</span>
                      <Badge className={r.status === 'Adequate' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={r.allocated} 
                        onChange={(e) => {
                          const updated = db.updateResource(r.id, parseInt(e.target.value) || 0);
                          setResources([...updated]);
                        }}
                        className="w-20 px-2 py-1 text-xs border border-border bg-background rounded focus:outline-none"
                      />
                      <span className="text-[10px] text-muted-foreground">allocated / {r.required} required</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Interventions workflow */}
            <Card className="p-5 lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Emergency Intervention Tracking
                </h3>
                <p className="text-xs text-muted-foreground">Workflows for ongoing sanitary and medical responses</p>
              </div>

              <div className="space-y-4">
                {interventions.map((i) => (
                  <div key={i.id} className="p-4 bg-muted/20 border border-border/40 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{i.alertTitle}</h4>
                        <p className="text-xs text-muted-foreground">{i.villageName} • {i.team}</p>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/20">{i.status}</Badge>
                    </div>

                    {/* Interactive workflow progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Workflow Progress</span>
                        <span>{i.progress}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${i.progress}%` }} />
                      </div>
                    </div>

                    {/* Step checkboxes */}
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {[
                        { key: "alert", label: "Alert Issued" },
                        { key: "team", label: "Team Dispatched" },
                        { key: "test", label: "Source Sanitized" },
                        { key: "medicine", label: "Medicine Kits" },
                        { key: "campaign", label: "Advisory Done" },
                        { key: "resolved", label: "Issue Resolved" },
                      ].map((step) => (
                        <button
                          key={step.key}
                          onClick={() => {
                            const updated = db.updateInterventionStatus(i.id, step.key, !i.steps[step.key]);
                            setInterventions([...updated]);
                          }}
                          className={`px-2.5 py-1 rounded-full border ${i.steps[step.key] ? 'bg-primary/20 text-primary border-primary/20' : 'bg-card text-muted-foreground border-border/60'} hover:border-primary transition-all`}
                        >
                          {step.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: ASHA REPORTS APPROVALS PANEL */}
        {activeTab === "approvals" && (
          <Card className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">ASHA & Volunteer Report Approvals</h2>
              <p className="text-xs text-muted-foreground">Verify and approve reports from the field before they ingest into the Outbreak Prediction Engine</p>
            </div>

            <div className="space-y-3">
              {pendingReports.filter(r => r.status === "Pending").length === 0 ? (
                <div className="text-center py-6">
                  <ShieldCheck className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-green-500">All Field Reports Processed</p>
                  <p className="text-xs text-muted-foreground">No reports pending verification</p>
                </div>
              ) : pendingReports.filter(r => r.status === "Pending").map((r) => (
                <div key={r.id} className="p-4 bg-muted/20 border border-border/40 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{r.type} from {r.village}</h4>
                      <p className="text-xs text-muted-foreground">Submitted by {r.reporter} • {r.date}</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold">{r.cases} Cases</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic bg-card/60 p-2.5 rounded-xl border border-border/30">
                    "{r.details}"
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproveReport(r.id)} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs gap-1">
                      <Check className="h-3.5 w-3.5" /> Approve & Feed AI
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejectReport(r.id)} className="h-8 text-xs gap-1">
                      <X className="h-3.5 w-3.5" /> Reject Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* TAB 5: OUTBREAK WARNING TIMELINE & SIMULATION */}
        {activeTab === "timeline" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Outbreak Timeline */}
            <Card className="p-5 lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Outbreak Evolution Timeline
                </h3>
                <p className="text-xs text-muted-foreground">Visual path of early warning triggers and escalation levels</p>
              </div>

              <div className="relative border-l border-border/60 pl-6 ml-3 space-y-6">
                {[
                  { day: "Day 1: Initial Triggers", desc: "ASHA worker logs 10 fever and stomach pain reports in Dibrugarh Town.", status: "Low Alert", color: "border-blue-500", text: "text-blue-400" },
                  { day: "Day 2: Environmental Telemetry", desc: "IoT sensor #1 reports turbidity above safe limit (8.5 NTU) and pH drop.", status: "Medium Alert", color: "border-yellow-500", text: "text-yellow-400" },
                  { day: "Day 3: AI Engine Ingests data", desc: "Prediction engine evaluates telemetry and triggers a 92% Outbreak Risk score.", status: "High Alert", color: "border-orange-500", text: "text-orange-400" },
                  { day: "Day 4: Broadcast Issued", desc: "System generates automated SMS and dashboard warning alerts to local volunteers.", status: "Critical Alert", color: "border-red-500", text: "text-red-400" },
                  { day: "Day 5: Intervention Deployed", desc: "Health Officials dispatch Response Team A, sanitizing water sources and distributing ORS.", status: "Intervention Team Active", color: "border-green-500", text: "text-green-400" },
                ].map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-4 bg-background ${item.color}`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{item.day}</h4>
                        <Badge variant="outline" className={`text-[9px] ${item.text} border-current`}>{item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Outbreak Simulation Engine */}
            <Card className="p-5 lg:col-span-1 space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Outbreak Simulation Engine
                </h3>
                <p className="text-xs text-muted-foreground">Select a village to predict intervention effectiveness</p>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Simulate risk level outcomes in <strong>{selectedVillageData?.name || 'selected village'}</strong>:
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => runOutbreakSimulation(false)}>
                    Without Intervention
                  </Button>
                  <Button size="sm" className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => runOutbreakSimulation(true)}>
                    With Intervention
                  </Button>
                </div>

                {simulationResult && (
                  <div className="p-4 bg-muted/40 border border-border/40 rounded-2xl space-y-3 animate-fade-in">
                    <p className="text-xs font-semibold text-foreground">
                      Simulation Output ({simulationResult.applied ? "With Interventions" : "No Interventions"}):
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 bg-card rounded-xl border border-border/30">
                        <p className={`text-2xl font-black ${simulationResult.applied ? 'text-green-500' : 'text-red-500'}`}>
                          {simulationResult.riskScore}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">AI Risk Index</p>
                      </div>
                      <div className="p-2 bg-card rounded-xl border border-border/30">
                        <p className={`text-2xl font-black ${simulationResult.applied ? 'text-green-500' : 'text-red-500'}`}>
                          {simulationResult.expectedCases}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Expected Cases (7d)</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
                      {simulationResult.applied 
                        ? "🟢 Intervention reduces risk index by 65%. Outbreak successfully contained." 
                        : "🔴 Uncontained risk index. Probability of exponential epidemic is extremely high."}
                    </p>
                  </div>
                )}
              </div>

              {/* EMERGENCY ESCALATION WORKFLOW VISUAL */}
              <div className="pt-2 border-t border-border/40">
                <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Emergency Escalation Workflow
                </p>
                <div className="flex flex-col gap-1.5 pl-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                    <span className="text-muted-foreground">Low / Medium severity ➔ Local ASHA Notification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" />
                    <span className="text-muted-foreground">High severity ➔ Clinic Staff & Primary Care Alert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />
                    <span className="text-muted-foreground">Critical threshold ➔ District Health Officer dispatched</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-red-800 inline-block" />
                    <span className="text-muted-foreground">Outbreak confirmed ➔ State Health Ministry advisory</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* VILLAGE PROFILE MODAL */}
        {isProfileOpen && profileVillage && (
          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  Village Profile: {profileVillage.name}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Profile Stats */}
                <div className="space-y-4">
                  <Card className="p-4 bg-muted/20 border-border/40">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Demographics & Water Infrastructure</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Population</p>
                        <p className="font-semibold text-foreground">{profileVillage.population}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monitored Water Sources</p>
                        <p className="font-semibold text-foreground">{profileVillage.waterSources} sites</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Main Supply</p>
                        <p className="font-semibold text-foreground">{profileVillage.mainWaterSource}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Risk Category</p>
                        <Badge className={profileVillage.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                          {profileVillage.riskLevel?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-muted/20 border-border/40 space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Outbreak Telemetry</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span>Active Disease Cases</span>
                      <span className="font-bold text-foreground">{profileVillage.cases} cases</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Historical Outbreaks</span>
                      <span className="font-bold text-foreground">3 recorded (Monsoon)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Pathogen Prediction Score</span>
                      <span className="font-bold text-primary">{profileVillage.predictionScore}%</span>
                    </div>
                  </Card>
                </div>

                {/* IoT status & Intervention details */}
                <div className="space-y-4">
                  <Card className="p-4 bg-muted/20 border-border/40 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Associated IoT Sensors</h4>
                    {sensors.filter(s => s.village === profileVillage.name).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No sensors deployed in this location</p>
                    ) : sensors.filter(s => s.village === profileVillage.name).map(s => (
                      <div key={s.id} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-foreground">{s.name.split(" (")[0]}</span>
                        <Badge variant="outline" className={s.status === 'Online' ? 'text-green-400 border-green-500/20' : 'text-yellow-400 border-yellow-500/20'}>
                          {s.status} ({s.battery})
                        </Badge>
                      </div>
                    ))}
                  </Card>

                  <Card className="p-4 bg-muted/20 border-border/40 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Response & Interventions</h4>
                    <div className="flex justify-between items-center text-xs">
                      <span>Assigned Medical Teams</span>
                      <span className="font-medium text-foreground">{profileVillage.resourcesAssigned} Teams</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Ongoing Interventions</span>
                      <span className="font-medium text-foreground">
                        {interventions.filter(i => i.villageName === profileVillage.name).length} Active
                      </span>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsProfileOpen(false)}>Close Profile</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
