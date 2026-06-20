import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ESCALATION_CONFIG = [
  { level: 1, role: 'ASHA Worker', delay_minutes: 5 },
  { level: 2, role: 'District Officer', delay_minutes: 10 },
  { level: 3, role: 'State Health Department', delay_minutes: 15 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { alert_id } = await req.json();

    console.log('Starting alert escalation for:', alert_id);

    // Get alert details
    const { data: alert } = await supabase
      .from('alerts')
      .select('*, villages(*)')
      .eq('id', alert_id)
      .single();

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Start escalation chain
    await processEscalationChain(supabase, alert);

    return new Response(
      JSON.stringify({ success: true, alert_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in alert escalation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processEscalationChain(supabase: any, alert: any) {
  for (const config of ESCALATION_CONFIG) {
    // Check if already acknowledged at this level
    const { data: existingLog } = await supabase
      .from('alert_escalation_logs')
      .select('*')
      .eq('alert_id', alert.id)
      .eq('escalation_level', config.level)
      .single();

    if (existingLog?.acknowledged_at) {
      console.log(`Level ${config.level} already acknowledged, stopping escalation`);
      return;
    }

    // Get recipient contact based on role
    const recipient = await getRecipientForRole(supabase, config.role, alert.village_id);

    if (!recipient.phone) {
      console.log(`No phone number for ${config.role}, skipping`);
      continue;
    }

    // Send alert via SMS
    const message = formatAlertMessage(alert, config);
    await sendSMS(supabase, recipient.phone, message);

    // Log escalation
    const { data: escalationLog } = await supabase
      .from('alert_escalation_logs')
      .insert({
        alert_id: alert.id,
        escalation_level: config.level,
        recipient_role: config.role,
        recipient_name: recipient.name,
        recipient_phone: recipient.phone,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    console.log(`Alert sent to ${config.role} at level ${config.level}`);

    // Wait for response time
    const delayMs = config.delay_minutes * 60 * 1000;
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Check if acknowledged
    const { data: updatedLog } = await supabase
      .from('alert_escalation_logs')
      .select('*')
      .eq('id', escalationLog.id)
      .single();

    if (updatedLog.acknowledged_at) {
      console.log(`Alert acknowledged by ${config.role}, stopping escalation`);
      return;
    }

    console.log(`No response from ${config.role} after ${config.delay_minutes} minutes, escalating...`);
  }

  console.log('All escalation levels exhausted');
}

async function getRecipientForRole(supabase: any, role: string, village_id: string) {
  // Get profile with matching role and village
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role.toLowerCase().replace(' ', '_'))
    .eq('village_id', village_id)
    .single();

  if (profile) {
    return {
      name: profile.full_name,
      phone: profile.phone,
    };
  }

  // Fallback: Get any user with the role
  const { data: anyProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role.toLowerCase().replace(' ', '_'))
    .limit(1)
    .single();

  return {
    name: anyProfile?.full_name || role,
    phone: anyProfile?.phone || null,
  };
}

function formatAlertMessage(alert: any, config: any): string {
  return `🚨 ALERT ESCALATION - Level ${config.level}
${alert.title}
Village: ${alert.villages?.name || 'Unknown'}
Severity: ${alert.severity.toUpperCase()}
Details: ${alert.message}
Please acknowledge this alert immediately.
Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
}

async function sendSMS(supabase: any, phone: string, message: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms-alert', {
      body: { phone, message }
    });

    if (error) {
      console.error('Error sending SMS:', error);
    } else {
      console.log('SMS sent successfully to:', phone);
    }
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}
