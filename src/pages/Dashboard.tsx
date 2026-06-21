import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { db } from "@/utils/db";
import { useTranslation } from "react-i18next";

import { 
  Droplet, AlertTriangle, Users, Activity, CloudRain, Shield, Award, 
  CheckCircle, Clock, RefreshCw, Bot, Send, ShieldAlert, BarChart2, 
  TrendingUp, Download, Eye, Heart, Layers, Database, AlertOctagon, 
  HelpCircle, Thermometer, Info, Check, Plus, ShieldCheck, MapPin, Trophy, X, FileText, CheckCircle2, Microscope
} from "lucide-react";

import { WaterQualityChart } from "@/components/dashboard/WaterQualityChart";
import { RiskMap } from "@/components/dashboard/RiskMap";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { HealthStats } from "@/components/dashboard/HealthStats";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ----------------------------------------------------
// 1. SKELETON LOADER
// ----------------------------------------------------
const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:pl-72 pt-20 lg:pt-8 bg-gradient-to-br from-background via-background to-primary/5 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <div className="h-16 bg-card border border-border/60 rounded-2xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card border border-border/60 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[300px] bg-card border border-border/60 rounded-2xl"></div>
            <div className="h-[250px] bg-card border border-border/60 rounded-2xl"></div>
          </div>
          <div className="h-[400px] bg-card border border-border/60 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. ADMINISTRATOR DASHBOARD
// ----------------------------------------------------
const AdminDashboard = ({ 
  districts, villages, allVillages, selectedDistrict, selectedVillage,
  handleDistrictChange, setSelectedVillage, openVillageProfile, loadAllData,
  activeSensorsCount, activeAlertsCount, totalCasesCount, sensors, 
  simulationResult, runOutbreakSimulation 
}: any) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Admin Command Console</h2>
          <p className="text-xs text-muted-foreground">Full system configuration, IoT telemetry, and outbreak escalation parameters</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAllData} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Refresh System
        </Button>
      </div>

      {/* FILTER PANEL */}
      <Card className="p-4 border border-border/60 bg-card/40 backdrop-blur-md rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">District:</span>
          </div>
          <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Village:</span>
          </div>
          <Select value={selectedVillage} onValueChange={setSelectedVillage}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl">
              <SelectValue placeholder="Village" />
            </SelectTrigger>
            <SelectContent>
              {villages.map((v: any) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVillage && (
          <Button size="sm" variant="outline" onClick={() => openVillageProfile(selectedVillage)} className="gap-1 border-primary/20 hover:border-primary">
            <Eye className="h-4 w-4" /> Inspect Profile
          </Button>
        )}
      </Card>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl">
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

        <Card className="p-5 bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 rounded-2xl">
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

        <Card className="p-5 bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-2xl">
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

        <Card className="p-5 bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-2xl">
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

      {/* CORE INTEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RiskMap />
          <WaterQualityChart />
        </div>

        <div className="space-y-6">
          {/* SIMULATION CARD */}
          <Card className="p-5 border border-primary/20 bg-card space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Outbreak Simulation Engine
              </h3>
              <p className="text-xs text-muted-foreground">Predict intervention effectiveness for selected village</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => runOutbreakSimulation(false)}>
                  Without Intervention
                </Button>
                <Button size="sm" className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => runOutbreakSimulation(true)}>
                  With Intervention
                </Button>
              </div>

              {simulationResult && (
                <div className="p-4 bg-muted/40 border border-border/40 rounded-2xl space-y-3">
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
                </div>
              )}
            </div>
          </Card>

          {/* SENSOR HEALTH MONITORING */}
          <Card className="p-5">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Sensor Health Monitoring
            </h3>
            <div className="space-y-2">
              {sensors.slice(0, 5).map((s: any) => (
                <div key={s.id} className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Batt: {s.battery}</p>
                  </div>
                  <Badge className={s.status === 'Online' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}>
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlerts />
        <HealthStats />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. HEALTH OFFICER DASHBOARD
// ----------------------------------------------------
const HealthOfficerDashboard = ({
  districts, villages, allVillages, selectedDistrict, selectedVillage,
  handleDistrictChange, setSelectedVillage, openVillageProfile, loadAllData,
  activeAlertsCount, totalCasesCount, pendingReports, handleApproveReport,
  handleRejectReport, selectedVillageData, getResourceRecommendations,
  actionsChecked, setActionsChecked
}: any) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Epidemiological Surveillance Hub</h2>
          <p className="text-xs text-muted-foreground">Monitor disease hotspots, review symptom reports, and coordinate intervention logistics</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAllData} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* FILTER PANEL */}
      <Card className="p-4 border border-border/60 bg-card/40 backdrop-blur-md rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">District:</span>
          </div>
          <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Village:</span>
          </div>
          <Select value={selectedVillage} onValueChange={setSelectedVillage}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl">
              <SelectValue placeholder="Village" />
            </SelectTrigger>
            <SelectContent>
              {villages.map((v: any) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVillage && (
          <Button size="sm" variant="outline" onClick={() => openVillageProfile(selectedVillage)} className="gap-1 border-primary/20 hover:border-primary">
            <Eye className="h-4 w-4" /> Inspect Profile
          </Button>
        )}
      </Card>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border border-primary/20 bg-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active Alerts</p>
              <h3 className="text-2xl font-bold text-destructive mt-1">{activeAlertsCount}</h3>
            </div>
            <div className="p-3 bg-destructive/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-primary/20 bg-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Logged Cases (Total)</p>
              <h3 className="text-2xl font-bold text-success mt-1">{totalCasesCount}</h3>
            </div>
            <div className="p-3 bg-success/10 rounded-xl">
              <Activity className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-primary/20 bg-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Pending ASHA Reports</p>
              <h3 className="text-2xl font-bold text-primary mt-1">{pendingReports.filter((r: any) => r.status === "Pending").length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* CORE SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RiskMap />
          <WaterQualityChart />
        </div>

        <div className="space-y-6">
          {/* AI EXPLAINABILITY */}
          {selectedVillageData && (
            <Card className="p-5 border border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">AI Explainability</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-background/55 p-3 rounded-xl border border-border/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Village Profile</p>
                    <p className="text-sm font-semibold text-foreground">{selectedVillageData.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                    <Badge className={selectedVillageData.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
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
              </div>
            </Card>
          )}

          {/* AI RECOMMENDATION */}
          {selectedVillageData && (
            <Card className="p-5 border border-primary/20 bg-gradient-to-br from-card to-secondary/5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-secondary" />
                <h3 className="text-base font-bold text-foreground font-semibold">AI Recommendation Engine</h3>
              </div>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Recommended contingency deployment for <strong>{selectedVillageData.name}</strong>:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/40 rounded-xl text-center">
                    <p className="text-lg font-bold text-secondary">{getResourceRecommendations(selectedVillageData.riskScore).doctors}</p>
                    <p className="text-[10px] text-muted-foreground">Doctors</p>
                  </div>
                  <div className="p-2 bg-muted/40 rounded-xl text-center">
                    <p className="text-lg font-bold text-secondary">{getResourceRecommendations(selectedVillageData.riskScore).nurses}</p>
                    <p className="text-[10px] text-muted-foreground">Nurses</p>
                  </div>
                  <div className="p-2 bg-muted/40 rounded-xl text-center">
                    <p className="text-lg font-bold text-secondary">{getResourceRecommendations(selectedVillageData.riskScore).ORS}</p>
                    <p className="text-[10px] text-muted-foreground">ORS Kits</p>
                  </div>
                  <div className="p-2 bg-muted/40 rounded-xl text-center">
                    <p className="text-lg font-bold text-secondary">{getResourceRecommendations(selectedVillageData.riskScore).tankers}</p>
                    <p className="text-[10px] text-muted-foreground">Water Tanker</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ASHA APPROVALS */}
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            ASHA Field Reports Verification
          </h3>
          <p className="text-xs text-muted-foreground">Verify and ingest reports from the field before they load into the Outbreak Prediction Engine</p>
        </div>

        <div className="space-y-3">
          {pendingReports.filter((r: any) => r.status === "Pending").length === 0 ? (
            <div className="text-center py-6">
              <ShieldCheck className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-500">All Field Reports Processed</p>
              <p className="text-xs text-muted-foreground">No reports pending verification</p>
            </div>
          ) : (
            pendingReports.filter((r: any) => r.status === "Pending").map((r: any) => (
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
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

// ----------------------------------------------------
// 4. CLINICAL STAFF DASHBOARD
// ----------------------------------------------------
const ClinicalStaffDashboard = ({ allVillages, symptomClusters, openVillageProfile }: any) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Clinic Diagnostic Console</h2>
        <p className="text-xs text-muted-foreground">Log clinical cases, analyze symptoms clusters, and check water pathogen photos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Patient Cases</span>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">24 Active</h3>
          <p className="text-xs text-muted-foreground">Logged across 3 local villages this week</p>
          <Button size="sm" className="w-full mt-2" onClick={() => window.location.href = "/reports"}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Log New Symptom Case
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Pathogen Photos</span>
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Image Analysis</h3>
          <p className="text-xs text-muted-foreground">Upload and analyze microscopic pathogen images</p>
          <Button size="sm" variant="outline" className="w-full mt-2 border-primary/20 hover:border-primary" onClick={() => window.location.href = "/image-analysis"}>
            <Microscope className="h-3.5 w-3.5 mr-1" /> Open Image Analyzer
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Regional Heatmap</span>
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Risk Zones</h3>
          <p className="text-xs text-muted-foreground">Check risk status of surrounding communities</p>
          <Button size="sm" variant="outline" className="w-full mt-2 border-primary/20 hover:border-primary" onClick={() => window.location.href = "/map"}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Open Live Heatmap
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RiskMap />
        </div>

        {/* Symptom Cluster Panel */}
        <Card className="p-5 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Symptom Cluster Detection AI
          </h3>
          <div className="space-y-3">
            {symptomClusters.map((c: any) => (
              <div key={c.id} className="p-3 bg-muted/20 border border-border/40 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{c.village}</span>
                  <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/20">{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Details: {c.details}</p>
                <div className="flex justify-between text-[10px] text-primary">
                  <span>Pattern: {c.pattern}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. ASHA WORKER DASHBOARD
// ----------------------------------------------------
const ASHAWorkerDashboard = ({ allVillages, selectedVillage, setSelectedVillage }: any) => {
  const { toast } = useToast();
  const [symptomData, setSymptomData] = useState({ symptoms: "", cases: "1", details: "" });
  const [waterData, setWaterData] = useState({ source: "well", issue: "", details: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSymptomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomData.symptoms) {
      toast({ variant: "destructive", title: "Required Field", description: "Please enter patient symptoms." });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "✓ Case Report Submitted", description: "Report successfully queued for verification." });
      setSymptomData({ symptoms: "", cases: "1", details: "" });
    }, 1000);
  };

  const handleWaterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterData.issue) {
      toast({ variant: "destructive", title: "Required Field", description: "Please select the water issue." });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "✓ Water Report Submitted", description: "Water contamination report successfully saved." });
      setWaterData({ source: "well", issue: "", details: "" });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">ASHA Worker Portal</h2>
        <p className="text-xs text-muted-foreground">Submit symptom/water reports directly from your assigned sector</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* SYMPTOM CASE REPORT */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Log Patient Symptom Case</h3>
            </div>
            <form onSubmit={handleSymptomSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Select Village</label>
                  <select 
                    value={selectedVillage} 
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs"
                  >
                    {allVillages.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Number of Cases</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={symptomData.cases} 
                    onChange={(e) => setSymptomData(prev => ({ ...prev, cases: e.target.value }))}
                    className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Symptom Types (e.g. Diarrhea, Vomiting, Fever)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Diarrhea & Fever" 
                  value={symptomData.symptoms} 
                  onChange={(e) => setSymptomData(prev => ({ ...prev, symptoms: e.target.value }))}
                  className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Additional Details / Comments</label>
                <textarea 
                  rows={2} 
                  placeholder="Describe patient age groups or observations..." 
                  value={symptomData.details} 
                  onChange={(e) => setSymptomData(prev => ({ ...prev, details: e.target.value }))}
                  className="w-full p-3 border border-border bg-background rounded-xl text-xs"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-10 gap-1.5">
                {submitting ? "Submitting..." : <><Plus className="h-4 w-4" /> Submit Symptom Report</>}
              </Button>
            </form>
          </Card>

          {/* WATER CONTAMINATION REPORT */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Droplet className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Log Water Contamination Issue</h3>
            </div>
            <form onSubmit={handleWaterSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Water Source Type</label>
                  <select 
                    value={waterData.source} 
                    onChange={(e) => setWaterData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs"
                  >
                    <option value="well">Public Tube Well</option>
                    <option value="pond">Community Pond</option>
                    <option value="river">River Source</option>
                    <option value="pipe">Piped Supply</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Observed Issue</label>
                  <select 
                    value={waterData.issue} 
                    onChange={(e) => setWaterData(prev => ({ ...prev, issue: e.target.value }))}
                    className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs"
                  >
                    <option value="">-- Choose Issue --</option>
                    <option value="turbid">Discolored / Muddy Water</option>
                    <option value="smell">Foul Smell / Stagnant Odor</option>
                    <option value="algae">Green Algae / Floating Scum</option>
                    <option value="leak">Pipeline Leak / Open Drainage</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">observations notes</label>
                <textarea 
                  rows={2} 
                  placeholder="Describe location details or suspected sources of leakage..." 
                  value={waterData.details} 
                  onChange={(e) => setWaterData(prev => ({ ...prev, details: e.target.value }))}
                  className="w-full p-3 border border-border bg-background rounded-xl text-xs"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-10 gap-1.5">
                {submitting ? "Submitting..." : <><Plus className="h-4 w-4" /> Submit Contamination Report</>}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          {/* REGIONAL ALERTS */}
          <Card className="p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ASHA Alerts Stream
            </h3>
            <p className="text-xs text-muted-foreground">Urgent containment briefs and active advisories</p>
            <div className="space-y-2">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-500">Dibrugarh Town</span>
                  <Badge className="bg-red-500 text-white text-[9px]">CRITICAL</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Fecal pathogen coliform count elevated in public tube well #3. Advisory issued to boil all drinking water.</p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-500">Naharkatia</span>
                  <Badge className="bg-amber-500 text-white text-[9px]">WARNING</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Minor symptom cluster detected (diarrhea/vomiting) in sector 2. Clean chlorination tablet distributions are underway.</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="text-xs font-bold text-foreground">ASHA Quick Guide</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use this dashboard to log field observation data directly. Approved reports feed the AI prediction engine to forecast localized epidemics.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 6. VOLUNTEER DASHBOARD (WITH QUIZ)
// ----------------------------------------------------
const VolunteerDashboard = ({ allVillages, selectedVillage, setSelectedVillage }: any) => {
  const { toast } = useToast();
  const [symptomData, setSymptomData] = useState({ symptoms: "", cases: "1", details: "" });
  const [submitting, setSubmitting] = useState(false);

  // Gamification state
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem("volunteer_points") || "250"));
  const [quizzes, setQuizzes] = useState(() => [
    { id: 1, title: "Clean Water Sanitation", completed: localStorage.getItem("quiz_1_done") === "true", points: 50 },
    { id: 2, title: "Hygiene & Handwashing", completed: localStorage.getItem("quiz_2_done") === "true", points: 70 },
  ]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const handleSymptomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomData.symptoms) {
      toast({ variant: "destructive", title: "Required Field", description: "Please enter symptoms." });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "✓ Symptom Logged", description: "Report successfully saved." });
      setSymptomData({ symptoms: "", cases: "1", details: "" });
    }, 1000);
  };

  const handleQuizStart = (quiz: any) => {
    if (quiz.completed) {
      toast({ title: "Quiz Completed", description: "You have already completed this quiz!" });
      return;
    }
    setActiveQuiz(quiz);
    setSelectedAnswer("");
  };

  const handleQuizSubmit = () => {
    if (!selectedAnswer) return;
    const isCorrect = selectedAnswer === "correct";
    if (isCorrect) {
      const newPoints = points + activeQuiz.points;
      setPoints(newPoints);
      localStorage.setItem("volunteer_points", newPoints.toString());
      localStorage.setItem(`quiz_${activeQuiz.id}_done`, "true");
      setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, completed: true } : q));
      toast({ title: "🎉 Correct Answer!", description: `Awesome! You earned +${activeQuiz.points} points.` });
    } else {
      toast({ variant: "destructive", title: "❌ Incorrect", description: "Try again! Read the educational info carefully." });
    }
    setActiveQuiz(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Volunteer Center</h2>
          <p className="text-xs text-muted-foreground">Report symptoms, inspect local safety maps, and complete learning modules</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">{points} Points</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RiskMap />

          {/* REPORT FORM */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Plus className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Log Community Health Case</h3>
            </div>
            <form onSubmit={handleSymptomSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Select Village</label>
                  <select 
                    value={selectedVillage} 
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs"
                  >
                    {allVillages.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Number of Cases</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={symptomData.cases} 
                    onChange={(e) => setSymptomData(prev => ({ ...prev, cases: e.target.value }))}
                    className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Symptoms Observed</label>
                <input 
                  type="text" 
                  placeholder="e.g. Diarrhea, Vomiting, Abdominal Pain" 
                  value={symptomData.symptoms} 
                  onChange={(e) => setSymptomData(prev => ({ ...prev, symptoms: e.target.value }))}
                  className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-10">
                {submitting ? "Logging..." : "Log Community Report"}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          {/* LEARN & EARN */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Award className="h-5 w-5 text-secondary" />
              <h3 className="text-base font-bold text-foreground font-semibold">Learn & Earn Portal</h3>
            </div>
            <p className="text-xs text-muted-foreground">Answer quick water safety questions to complete certificates and points.</p>
            
            <div className="space-y-2">
              {quizzes.map((q) => (
                <div key={q.id} className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{q.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Value: {q.points} pts</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant={q.completed ? "ghost" : "default"} 
                    className="text-xs h-8"
                    onClick={() => handleQuizStart(q)}
                  >
                    {q.completed ? "✓ Done" : "Start"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* QUIZ INTERACTIVE DIALOG */}
      {activeQuiz && (
        <Dialog open={!!activeQuiz} onOpenChange={() => setActiveQuiz(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {activeQuiz.title} Quiz
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3 text-sm">
              {activeQuiz.id === 1 ? (
                <>
                  <p className="font-semibold text-foreground">What is the safe pH range for drinking water?</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setSelectedAnswer("wrong1")}
                      className={`w-full p-3 rounded-xl border text-left text-xs ${selectedAnswer === "wrong1" ? "border-primary bg-primary/5 text-primary" : "border-border/60"}`}
                    >
                      A. 4.0 - 5.5 (Acidic)
                    </button>
                    <button 
                      onClick={() => setSelectedAnswer("correct")}
                      className={`w-full p-3 rounded-xl border text-left text-xs ${selectedAnswer === "correct" ? "border-primary bg-primary/5 text-primary" : "border-border/60"}`}
                    >
                      B. 6.5 - 8.5 (Neutral / Standard)
                    </button>
                    <button 
                      onClick={() => setSelectedAnswer("wrong2")}
                      className={`w-full p-3 rounded-xl border text-left text-xs ${selectedAnswer === "wrong2" ? "border-primary bg-primary/5 text-primary" : "border-border/60"}`}
                    >
                      C. 9.0 - 11.0 (Highly Alkaline)
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground">Which of the following is the most effective method for killing pathogens in drinking water?</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setSelectedAnswer("wrong1")}
                      className={`w-full p-3 rounded-xl border text-left text-xs ${selectedAnswer === "wrong1" ? "border-primary bg-primary/5 text-primary" : "border-border/60"}`}
                    >
                      A. Simple sedimentation sand-filtering
                    </button>
                    <button 
                      onClick={() => setSelectedAnswer("correct")}
                      className={`w-full p-3 rounded-xl border text-left text-xs ${selectedAnswer === "correct" ? "border-primary bg-primary/5 text-primary" : "border-border/60"}`}
                    >
                      B. Rolling boil for 1 full minute
                    </button>
                    <button 
                      onClick={() => setSelectedAnswer("wrong2")}
                      className={`w-full p-3 rounded-xl border text-left text-xs ${selectedAnswer === "wrong2" ? "border-primary bg-primary/5 text-primary" : "border-border/60"}`}
                    >
                      C. Leaving it open to direct sunlight for 5 minutes
                    </button>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-3">
                <Button variant="ghost" onClick={() => setActiveQuiz(null)}>Cancel</Button>
                <Button onClick={handleQuizSubmit}>Submit Answer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 7. MAIN DASHBOARD CONTAINER
// ----------------------------------------------------
const Dashboard = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { roles, loading: roleLoading } = useUserRole();

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
    const filtered = allVillagesData.filter((v: any) => v.districtId === selectedDistrict);
    setVillages(filtered);
    if (filtered.length > 0) {
      setSelectedVillage(filtered[0].id);
    }
  };

  // Trigger when district changes
  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    const filtered = allVillages.filter((v: any) => v.districtId === val);
    setVillages(filtered);
    if (filtered.length > 0) {
      setSelectedVillage(filtered[0].id);
    }
  };

  // Open Village Profile Modal
  const openVillageProfile = (vId: string) => {
    const v = allVillages.find((x: any) => x.id === vId);
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

  const selectedVillageData = allVillages.find((v: any) => v.id === selectedVillage) || allVillages[0];
  const activeAlertsCount = allVillages.reduce((acc: number, v: any) => acc + (v.alerts || 0), 0);
  const totalCasesCount = allVillages.reduce((acc: number, v: any) => acc + (v.cases || 0), 0);
  const activeSensorsCount = sensors.filter((s: any) => s.status === "Online").length;

  // Decide layout based on primary role
  const getPrimaryRole = (rolesList: string[]) => {
    if (rolesList.includes('admin')) return 'admin';
    if (rolesList.includes('official') || rolesList.includes('health_official')) return 'official';
    if (rolesList.includes('clinic_staff') || rolesList.includes('clinic_staffs')) return 'clinic_staff';
    if (rolesList.includes('asha_worker')) return 'asha_worker';
    return 'volunteer';
  };

  if (roleLoading) {
    return <DashboardSkeleton />;
  }

  const primaryRole = getPrimaryRole(roles);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:pl-72 pt-20 lg:pt-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            AquaGuard <span className="text-primary font-black">AI Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Smart Community Health Monitoring & Early Warning System for Water-Borne Diseases
          </p>
        </div>

        {/* ROLE SPECIFIC DASHBOARDS */}
        {primaryRole === 'admin' && (
          <AdminDashboard 
            districts={districts}
            villages={villages}
            allVillages={allVillages}
            selectedDistrict={selectedDistrict}
            selectedVillage={selectedVillage}
            handleDistrictChange={handleDistrictChange}
            setSelectedVillage={setSelectedVillage}
            openVillageProfile={openVillageProfile}
            loadAllData={loadAllData}
            activeSensorsCount={activeSensorsCount}
            activeAlertsCount={activeAlertsCount}
            totalCasesCount={totalCasesCount}
            sensors={sensors}
            simulationResult={simulationResult}
            runOutbreakSimulation={runOutbreakSimulation}
          />
        )}

        {primaryRole === 'official' && (
          <HealthOfficerDashboard 
            districts={districts}
            villages={villages}
            allVillages={allVillages}
            selectedDistrict={selectedDistrict}
            selectedVillage={selectedVillage}
            handleDistrictChange={handleDistrictChange}
            setSelectedVillage={setSelectedVillage}
            openVillageProfile={openVillageProfile}
            loadAllData={loadAllData}
            activeAlertsCount={activeAlertsCount}
            totalCasesCount={totalCasesCount}
            pendingReports={pendingReports}
            handleApproveReport={handleApproveReport}
            handleRejectReport={handleRejectReport}
            selectedVillageData={selectedVillageData}
            getResourceRecommendations={getResourceRecommendations}
            actionsChecked={actionsChecked}
            setActionsChecked={setActionsChecked}
          />
        )}

        {primaryRole === 'clinic_staff' && (
          <ClinicalStaffDashboard 
            allVillages={allVillages}
            symptomClusters={symptomClusters}
            openVillageProfile={openVillageProfile}
          />
        )}

        {primaryRole === 'asha_worker' && (
          <ASHAWorkerDashboard 
            allVillages={allVillages}
            selectedVillage={selectedVillage}
            setSelectedVillage={setSelectedVillage}
          />
        )}

        {primaryRole === 'volunteer' && (
          <VolunteerDashboard 
            allVillages={allVillages}
            selectedVillage={selectedVillage}
            setSelectedVillage={setSelectedVillage}
          />
        )}

        {/* VILLAGE PROFILE DIALOG */}
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
                <div className="space-y-4">
                  <Card className="p-4 bg-muted/20 border-border/40">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Demographics & Water Infrastructure</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Population</p>
                        <p className="font-semibold text-foreground">{profileVillage.population}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monitored Sources</p>
                        <p className="font-semibold text-foreground">{profileVillage.waterSources} sites</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Main Supply</p>
                        <p className="font-semibold text-foreground">{profileVillage.mainWaterSource}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Risk Category</p>
                        <Badge className={profileVillage.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                          {(profileVillage.riskLevel || 'low').toUpperCase()}
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

                <div className="space-y-4">
                  <Card className="p-4 bg-muted/20 border-border/40 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Associated IoT Sensors</h4>
                    {sensors.filter((s: any) => s.village === profileVillage.name).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No sensors deployed in this location</p>
                    ) : sensors.filter((s: any) => s.village === profileVillage.name).map((s: any) => (
                      <div key={s.id} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-foreground">{s.name.split(" (")[0]}</span>
                        <Badge variant="outline" className={s.status === 'Online' ? 'text-green-400 border-green-500/20' : 'text-red-400 border-red-500/20'}>
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
                        {interventions.filter((i: any) => i.villageName === profileVillage.name).length} Active
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
