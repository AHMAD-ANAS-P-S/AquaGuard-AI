import { supabase } from "@/integrations/supabase/client";

// LocalStorage helpers
const getFallback = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(`aquaguard_${key}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return stored as unknown as T;
    }
  }
  localStorage.setItem(`aquaguard_${key}`, JSON.stringify(defaultValue));
  return defaultValue;
};

const saveFallback = <T>(key: string, data: T): void => {
  localStorage.setItem(`aquaguard_${key}`, JSON.stringify(data));
};

// Initial Mock Data Setup for Presentations & Offline fallback
const MOCK_DISTRICTS = [
  { id: "d1", name: "Dibrugarh", cases: 142, alerts: 4, resources: 85, risk: "high" },
  { id: "d2", name: "Jorhat", cases: 78, alerts: 1, resources: 40, risk: "medium" },
  { id: "d3", name: "Majuli", cases: 25, alerts: 0, resources: 20, risk: "low" },
  { id: "d4", name: "Silchar", cases: 110, alerts: 3, resources: 70, risk: "high" },
  { id: "d5", name: "Tezpur", cases: 54, alerts: 1, resources: 35, risk: "medium" },
  { id: "d6", name: "Chennai", cases: 210, alerts: 5, resources: 90, risk: "high" },
  { id: "d7", name: "Tiruvallur", cases: 85, alerts: 2, resources: 45, risk: "medium" },
  { id: "d8", name: "Kanchipuram", cases: 65, alerts: 1, resources: 50, risk: "medium" },
  { id: "d9", name: "Erode", cases: 30, alerts: 0, resources: 40, risk: "low" },
  { id: "d10", name: "Vellore", cases: 42, alerts: 1, resources: 35, risk: "medium" },
  { id: "d11", name: "Salem", cases: 15, alerts: 0, resources: 25, risk: "low" },
];

const MOCK_VILLAGES = [
  { id: "v1", districtId: "d1", name: "Dibrugarh Town", population: 15000, waterSources: 4, cases: 42, riskScore: 85, riskLevel: "high", alerts: 2, resourcesAssigned: 5, predictionScore: 92, predictedDisease: "Cholera", mainWaterSource: "Brahmaputra Canal" },
  { id: "v2", districtId: "d1", name: "Barbaruah", population: 8200, waterSources: 3, cases: 18, riskScore: 48, riskLevel: "medium", alerts: 1, resourcesAssigned: 2, predictionScore: 54, predictedDisease: "Diarrhea", mainWaterSource: "Community Handpump" },
  { id: "v3", districtId: "d1", name: "Khowang", population: 6400, waterSources: 2, cases: 8, riskScore: 28, riskLevel: "low", alerts: 0, resourcesAssigned: 1, predictionScore: 22, predictedDisease: "None", mainWaterSource: "Open Well" },
  { id: "v4", districtId: "d2", name: "Jorhat Center", population: 21000, waterSources: 6, cases: 35, riskScore: 52, riskLevel: "medium", alerts: 1, resourcesAssigned: 3, predictionScore: 61, predictedDisease: "Typhoid", mainWaterSource: "Municipal Pipeline" },
  { id: "v5", districtId: "d2", name: "Mariani", population: 11500, waterSources: 4, cases: 24, riskScore: 72, riskLevel: "high", alerts: 2, resourcesAssigned: 4, predictionScore: 81, predictedDisease: "Hepatitis A", mainWaterSource: "River Stream" },
  { id: "v6", districtId: "d2", name: "Teok", population: 7800, waterSources: 3, cases: 6, riskScore: 19, riskLevel: "low", alerts: 0, resourcesAssigned: 0, predictionScore: 15, predictedDisease: "None", mainWaterSource: "Deep Tube Well" },
  { id: "v7", districtId: "d3", name: "Kamalabari", population: 5200, waterSources: 2, cases: 12, riskScore: 35, riskLevel: "low", alerts: 0, resourcesAssigned: 1, predictionScore: 30, predictedDisease: "None", mainWaterSource: "River Water" },
  { id: "v8", districtId: "d3", name: "Garamur", population: 4900, waterSources: 2, cases: 9, riskScore: 22, riskLevel: "low", alerts: 0, resourcesAssigned: 1, predictionScore: 18, predictedDisease: "None", mainWaterSource: "Hand Pump" },
  { id: "v9", districtId: "d4", name: "Silchar Ward 5", population: 18500, waterSources: 5, cases: 58, riskScore: 89, riskLevel: "high", alerts: 3, resourcesAssigned: 6, predictionScore: 94, predictedDisease: "Cholera", mainWaterSource: "Pond Water" },
  { id: "v10", districtId: "d5", name: "Tezpur Bazar", population: 14000, waterSources: 4, cases: 15, riskScore: 40, riskLevel: "medium", alerts: 0, resourcesAssigned: 2, predictionScore: 45, predictedDisease: "Dysentery", mainWaterSource: "Borewell Water" },
  { id: "v11", districtId: "d7", name: "Karlambakkam", population: 6000, waterSources: 3, cases: 12, riskScore: 45, riskLevel: "medium", alerts: 1, resourcesAssigned: 2, predictionScore: 50, predictedDisease: "Diarrhea", mainWaterSource: "Borewell Water" },
  { id: "v12", districtId: "d8", name: "Thiruper", population: 4500, waterSources: 2, cases: 5, riskScore: 25, riskLevel: "low", alerts: 0, resourcesAssigned: 1, predictionScore: 20, predictedDisease: "None", mainWaterSource: "Community Handpump" },
  { id: "v13", districtId: "d8", name: "Andhimanam", population: 5200, waterSources: 2, cases: 8, riskScore: 30, riskLevel: "low", alerts: 0, resourcesAssigned: 1, predictionScore: 28, predictedDisease: "None", mainWaterSource: "Open Well" },
  { id: "v14", districtId: "d8", name: "Pappankuzhi", population: 3800, waterSources: 1, cases: 2, riskScore: 15, riskLevel: "low", alerts: 0, resourcesAssigned: 0, predictionScore: 12, predictedDisease: "None", mainWaterSource: "Hand Pump" },
  { id: "v15", districtId: "d11", name: "Vengaivayal", population: 2900, waterSources: 1, cases: 14, riskScore: 65, riskLevel: "high", alerts: 1, resourcesAssigned: 2, predictionScore: 72, predictedDisease: "Typhoid", mainWaterSource: "Pond Water" },
];

const MOCK_PREDICTIONS = [
  { id: "p1", villageName: "Dibrugarh Town", riskScore: 85, predictedDisease: "Cholera", confidence: 92, reason: "+ 15 diarrhea cases, + Turbidity above safe limit, + Heavy monsoon rainfall in last 7 days, + Historical seasonal pattern matched" },
  { id: "p2", villageName: "Mariani", riskScore: 72, predictedDisease: "Hepatitis A", confidence: 84, reason: "+ 8 vomiting cases, + Contaminated well reports, + High bacterial count from IoT Sensor #2" },
  { id: "p3", villageName: "Silchar Ward 5", riskScore: 89, predictedDisease: "Cholera", confidence: 95, reason: "+ 22 gastrointestinal cases, + Safe pH thresholds breached, + Flooding in low-lying water resources" },
  { id: "p4", villageName: "Jorhat Center", riskScore: 52, predictedDisease: "Typhoid", confidence: 78, reason: "+ 5 fever cases, + Pipeline leakage detected, + Warm temperature aiding bacterial growth" },
];

const MOCK_RESOURCES = [
  { id: "r1", type: "Doctors", allocated: 12, required: 15, status: "Shortage" },
  { id: "r2", type: "Nurses", allocated: 28, required: 35, status: "Shortage" },
  { id: "r3", type: "ORS Kits", allocated: 1200, required: 1500, status: "Shortage" },
  { id: "r4", type: "Medicines (Doxycycline)", allocated: 850, required: 800, status: "Adequate" },
  { id: "r5", type: "Water Tankers", allocated: 4, required: 6, status: "Shortage" },
  { id: "r6", type: "Health Workers", allocated: 45, required: 45, status: "Adequate" },
];

const MOCK_INTERVENTIONS = [
  { id: "i1", villageName: "Dibrugarh Town", alertTitle: "Water Contamination Alert", status: "Medicine Distributed", team: "Response Unit A", progress: 75, steps: { alert: true, team: true, test: true, medicine: true, campaign: false, resolved: false } },
  { id: "i2", villageName: "Silchar Ward 5", alertTitle: "Cholera Outbreak Alert", status: "Investigation Started", team: "Epidemic Team 1", progress: 40, steps: { alert: true, team: true, test: false, medicine: false, campaign: false, resolved: false } },
  { id: "i3", villageName: "Mariani", alertTitle: "High Bacterial Load Warning", status: "Water Source Tested", team: "PHED Sanitation Cell", progress: 60, steps: { alert: true, team: true, test: true, medicine: false, campaign: false, resolved: false } },
  { id: "i4", villageName: "Jorhat Center", alertTitle: "Enteric Fever Alert", status: "Team Assigned", team: "Local Medical Officer", progress: 25, steps: { alert: true, team: true, test: false, medicine: false, campaign: false, resolved: false } },
];

const MOCK_SENSORS = [
  { id: "s1", name: "IoT Sensor #1 (Dibrugarh Town)", status: "Online", battery: "92%", village: "Dibrugarh Town", pH: 7.2, turbidity: 4.8, temp: "26°C", do: "6.5 mg/L", bacterial: "12 CFU/ml" },
  { id: "s2", name: "IoT Sensor #2 (Mariani Well)", status: "Low Battery", battery: "15%", village: "Mariani", pH: 6.1, turbidity: 8.5, temp: "28°C", do: "4.2 mg/L", bacterial: "150 CFU/ml" },
  { id: "s3", name: "IoT Sensor #3 (Silchar Ward 5)", status: "Online", battery: "84%", village: "Silchar Ward 5", pH: 5.8, turbidity: 12.0, temp: "29°C", do: "3.8 mg/L", bacterial: "210 CFU/ml" },
  { id: "s4", name: "IoT Sensor #4 (Tezpur Pond)", status: "Offline", battery: "0%", village: "Tezpur Bazar", pH: 7.0, turbidity: 3.2, temp: "25°C", do: "7.1 mg/L", bacterial: "4 CFU/ml" },
];

const MOCK_CLUSTERS = [
  { id: "c1", village: "Dibrugarh Town", details: "12 Fever, 9 Vomiting, 7 Diarrhea", pattern: "Possible Cholera / Gastrointestinal Outbreak", status: "Critical" },
  { id: "c2", village: "Silchar Ward 5", details: "18 Diarrhea, 14 Vomiting, 8 Dehydration", pattern: "Severe Water Contamination Outbreak", status: "Critical" },
  { id: "c3", village: "Mariani", details: "6 Fever, 5 Jaundice, 4 Nausea", pattern: "Potential Hepatitis A Outbreak", status: "High Alert" },
];

const MOCK_PENDING_REPORTS = [
  { id: "rep1", reporter: "Sunita Devi (ASHA)", village: "Dibrugarh Town", type: "Health Report", details: "7 children showing severe diarrhea and vomiting. All drink from same canal source.", cases: 7, date: "2026-06-20", status: "Pending" },
  { id: "rep2", reporter: "Rajesh Bora (Volunteer)", village: "Mariani", type: "Water Complaint", details: "Turbid well water with foul smell reported by multiple households.", cases: 0, date: "2026-06-21", status: "Pending" },
  { id: "rep3", reporter: "Anita Gogoi (ASHA)", village: "Silchar Ward 5", type: "Emergency Report", details: "Sudden spike in high-fever cases accompanied by intense abdominal pain.", cases: 12, date: "2026-06-21", status: "Pending" },
];

const MOCK_KPI = {
  villagesMonitored: 50,
  populationCovered: 120000,
  reportsCollected: 500,
  alertsGenerated: 20,
  outbreaksPrevented: 12,
  responseTimeReduction: "85%"
};

// Database utility object
export const db = {
  getDistricts: async () => {
    return getFallback("districts", MOCK_DISTRICTS);
  },

  getVillages: async () => {
    try {
      const { data, error } = await supabase.from('villages').select('*, districts(name)').order('name');
      if (error) throw error;
      
      // Merge live database fields with fallback details
      const local = getFallback("villages", MOCK_VILLAGES);
      return local.map(l => {
        const dbVal = (data as any[]).find(d => d.name === l.name);
        if (dbVal) {
          return { 
            ...l, 
            ...dbVal,
            district: dbVal.districts?.name || dbVal.district || null
          };
        }
        return l;
      });
    } catch {
      return getFallback("villages", MOCK_VILLAGES);
    }
  },

  saveVillage: async (village: any) => {
    const local = getFallback("villages", MOCK_VILLAGES);
    const idx = local.findIndex(v => v.id === village.id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...village };
      saveFallback("villages", local);
    }
    try {
      const isUuid = village.districtId && village.districtId.length === 36;
      await supabase.from('villages').upsert({
        name: village.name,
        risk_score: village.riskScore,
        risk_level: village.riskLevel,
        population: village.population,
        district_id: isUuid ? village.districtId : null
      });
    } catch (e) {
      console.warn("[AquaGuard DB] Suppress live DB update error on fallback:", e);
    }
  },

  getPredictions: async () => {
    try {
      const { data, error } = await supabase.from('ai_predictions').select('*, villages(name)');
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          villageName: d.villages?.name || "Unknown",
          riskScore: d.confidence_score ? Math.round(d.confidence_score * 100) : 70,
          predictedDisease: d.prediction_type,
          confidence: d.confidence_score ? Math.round(d.confidence_score * 100) : 90,
          reason: (d.prediction_data as any)?.reason || "Anomalous symptoms and water contamination trends detected."
        }));
      }
      return getFallback("predictions", MOCK_PREDICTIONS);
    } catch {
      return getFallback("predictions", MOCK_PREDICTIONS);
    }
  },

  getResources: async () => {
    return getFallback("resources", MOCK_RESOURCES);
  },

  updateResource: (id: string, allocated: number) => {
    const local = getFallback("resources", MOCK_RESOURCES);
    const idx = local.findIndex(r => r.id === id);
    if (idx !== -1) {
      local[idx].allocated = allocated;
      local[idx].status = allocated >= local[idx].required ? "Adequate" : "Shortage";
      saveFallback("resources", local);
    }
    return local;
  },

  getInterventions: async () => {
    return getFallback("interventions", MOCK_INTERVENTIONS);
  },

  updateInterventionStatus: (id: string, stepName: string, value: boolean) => {
    const local = getFallback("interventions", MOCK_INTERVENTIONS);
    const idx = local.findIndex(i => i.id === id);
    if (idx !== -1) {
      local[idx].steps = { ...local[idx].steps, [stepName]: value };
      
      // Calculate progress and current status
      const { alert, team, test, medicine, campaign, resolved } = local[idx].steps;
      let progress = 10;
      let status = "Alert Generated";

      if (team) { progress = 25; status = "Team Assigned"; }
      if (test) { progress = 45; status = "Water Source Tested"; }
      if (medicine) { progress = 70; status = "Medicine Distributed"; }
      if (campaign) { progress = 85; status = "Campaign Conducted"; }
      if (resolved) { progress = 100; status = "Resolved"; }

      local[idx].progress = progress;
      local[idx].status = status;
      saveFallback("interventions", local);
    }
    return local;
  },

  getSensors: async () => {
    return getFallback("sensors", MOCK_SENSORS);
  },

  getSymptomClusters: async () => {
    return getFallback("clusters", MOCK_CLUSTERS);
  },

  getPendingReports: async () => {
    return getFallback("pending_reports", MOCK_PENDING_REPORTS);
  },

  approveReport: (id: string) => {
    const local = getFallback("pending_reports", MOCK_PENDING_REPORTS);
    const idx = local.findIndex(r => r.id === id);
    if (idx !== -1) {
      local[idx].status = "Approved";
      saveFallback("pending_reports", local);
      
      // Increment reports submitted KPI
      const kpis = getFallback("kpi", MOCK_KPI);
      kpis.reportsCollected += 1;
      saveFallback("kpi", kpis);
    }
    return local;
  },

  rejectReport: (id: string) => {
    const local = getFallback("pending_reports", MOCK_PENDING_REPORTS);
    const idx = local.findIndex(r => r.id === id);
    if (idx !== -1) {
      local[idx].status = "Rejected";
      saveFallback("pending_reports", local);
    }
    return local;
  },

  getImpactKPIs: () => {
    return getFallback("kpi", MOCK_KPI);
  },

  simulateIntervention: (villageId: string, applyIntervention: boolean) => {
    const villages = getFallback("villages", MOCK_VILLAGES);
    const village = villages.find(v => v.id === villageId);
    if (!village) return { riskScore: 50, expectedCases: 20 };

    if (applyIntervention) {
      return {
        riskScore: Math.max(10, Math.round(village.riskScore * 0.35)),
        expectedCases: Math.max(2, Math.round(village.cases * 0.5))
      };
    } else {
      return {
        riskScore: Math.min(100, Math.round(village.riskScore * 1.15)),
        expectedCases: Math.round(village.cases * 3.3)
      };
    }
  }
};
