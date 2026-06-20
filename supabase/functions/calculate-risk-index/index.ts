import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { villageId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch village data
    const { data: alerts } = await supabase
      .from('alerts')
      .select('severity, status')
      .eq('village_id', villageId)
      .eq('status', 'active');

    const { data: healthReports } = await supabase
      .from('health_reports')
      .select('symptoms, cases_count, created_at')
      .eq('village_id', villageId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: waterReadings } = await supabase
      .from('water_quality_readings')
      .select('ph, bacterial_count, status, created_at')
      .eq('village_id', villageId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Calculate risk components
    let riskScore = 0;
    const factors = [];

    // Alert risk (0-30 points)
    const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;
    const highAlerts = alerts?.filter(a => a.severity === 'high').length || 0;
    const alertRisk = Math.min(30, criticalAlerts * 15 + highAlerts * 7);
    riskScore += alertRisk;
    if (alertRisk > 0) factors.push(`${alerts?.length} active alerts`);

    // Health report risk (0-40 points)
    const totalCases = healthReports?.reduce((sum, r) => sum + (r.cases_count || 0), 0) || 0;
    const prevWeekCases = healthReports?.filter(r => 
      new Date(r.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).reduce((sum, r) => sum + (r.cases_count || 0), 0) || 0;
    
    const healthRisk = Math.min(40, totalCases * 2);
    riskScore += healthRisk;
    if (totalCases > 0) {
      const change = prevWeekCases > 0 ? ((prevWeekCases / totalCases) * 100).toFixed(0) : 0;
      factors.push(`${totalCases} reported cases (${change}% in last week)`);
    }

    // Water quality risk (0-30 points)
    const badWaterReadings = waterReadings?.filter(r => 
      r.status === 'critical' || r.status === 'warning' || 
      (r.ph && (r.ph < 6.5 || r.ph > 8.5)) ||
      (r.bacterial_count && r.bacterial_count > 500)
    ).length || 0;
    
    const waterRisk = Math.min(30, badWaterReadings * 10);
    riskScore += waterRisk;
    if (badWaterReadings > 0) factors.push(`${badWaterReadings} poor water quality readings`);

    // Use AI to generate explanation
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a public health expert analyzing disease outbreak risk. Provide clear, actionable explanations.'
          },
          {
            role: 'user',
            content: `Analyze this village health data and explain the risk (score: ${riskScore}/100):
- Active alerts: ${alerts?.length || 0} (${criticalAlerts} critical, ${highAlerts} high)
- Health cases (last 30 days): ${totalCases}
- Poor water readings (last 7 days): ${badWaterReadings}

Provide a 2-3 sentence explanation of the risk level and key factors.`
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const explanation = aiData.choices[0].message.content;

    const result = {
      riskScore,
      riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
      factors,
      explanation,
      metrics: {
        alertRisk,
        healthRisk,
        waterRisk,
        totalCases,
        activeAlerts: alerts?.length || 0,
        badWaterReadings,
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Risk calculation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
