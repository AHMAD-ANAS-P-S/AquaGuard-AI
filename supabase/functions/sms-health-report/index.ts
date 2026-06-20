import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle Twilio webhook format
    const formData = await req.formData();
    const body = formData.get('Body') as string;
    const from = formData.get('From') as string;

    console.log('Received SMS health report from:', from, 'Body:', body);

    // Parse health report from SMS
    // Expected formats:
    // REPORT|VILLAGE:Name|SYMPTOMS:fever,diarrhea|CASES:5|NOTE:water contamination
    // Or simple: FEVER 5 CASES DIARRHEA VILLAGE_NAME
    const data = parseSMSReport(body);

    if (!data) {
      throw new Error('Invalid SMS format');
    }

    // Find village by name (case insensitive)
    let villageId = null;
    if (data.village) {
      const { data: villages } = await supabase
        .from('villages')
        .select('id')
        .ilike('name', `%${data.village}%`)
        .limit(1);
      
      if (villages && villages.length > 0) {
        villageId = villages[0].id;
      }
    }

    // Store the SMS report
    const { error: reportError } = await supabase
      .from('sms_reports')
      .insert({
        phone_number: from,
        message: body,
        parsed_data: data,
        village_id: villageId,
        status: 'received',
      });

    if (reportError) {
      console.error('Error storing SMS report:', reportError);
    }

    // If we have enough data, create a health report
    if (data.symptoms && data.symptoms.length > 0) {
      const { error: healthError } = await supabase
        .from('health_reports')
        .insert({
          village_id: villageId,
          symptoms: data.symptoms,
          case_count: data.cases || 1,
          notes: `SMS Report from ${from}: ${data.notes || body}`,
          status: 'pending',
        });

      if (healthError) {
        console.error('Error creating health report:', healthError);
      }
    }

    // Create alert if high case count
    if (data.cases && data.cases >= 3) {
      await supabase
        .from('alerts')
        .insert({
          village_id: villageId,
          alert_type: 'disease_outbreak',
          severity: data.cases >= 10 ? 'critical' : 'high',
          title: `SMS Alert: ${data.cases} cases reported`,
          message: `Received via SMS from ${from}. Symptoms: ${data.symptoms?.join(', ') || 'unspecified'}`,
          status: 'active',
        });
    }

    // Send confirmation SMS back
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      const confirmationMsg = data.symptoms 
        ? `AquaGuard: Report received. ${data.symptoms.length} symptoms, ${data.cases || 1} cases logged. Help is on the way.`
        : `AquaGuard: Message received. For reports, use: REPORT|VILLAGE:name|SYMPTOMS:fever,diarrhea|CASES:5`;

      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: from,
            From: twilioPhoneNumber,
            Body: confirmationMsg,
          }),
        }
      );
    }

    // Respond to Twilio webhook
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Report received. Thank you!</Message></Response>',
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/xml' 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing SMS report:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error processing report. Please try again.</Message></Response>',
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/xml' 
        } 
      }
    );
  }
});

function parseSMSReport(sms: string): any {
  try {
    const upperSMS = sms.toUpperCase().trim();
    
    // Check for structured format: REPORT|VILLAGE:X|SYMPTOMS:X|CASES:X
    if (upperSMS.includes('|')) {
      const parts = sms.split('|');
      const data: any = {};

      for (const part of parts) {
        const [key, value] = part.split(':').map(s => s.trim());
        switch (key.toUpperCase()) {
          case 'VILLAGE':
            data.village = value;
            break;
          case 'SYMPTOMS':
            data.symptoms = value.toLowerCase().split(',').map(s => s.trim());
            break;
          case 'CASES':
            data.cases = parseInt(value) || 1;
            break;
          case 'NOTE':
          case 'NOTES':
            data.notes = value;
            break;
        }
      }

      return Object.keys(data).length > 0 ? data : null;
    }

    // Parse natural language format
    const data: any = { symptoms: [] };
    
    // Common symptoms detection
    const symptomKeywords = [
      'fever', 'diarrhea', 'diarrhoea', 'vomiting', 'nausea', 
      'stomach', 'headache', 'body pain', 'weakness', 'dehydration',
      'bukhar', 'ulti', 'dast', 'pet dard', 'kamjori'
    ];

    for (const symptom of symptomKeywords) {
      if (upperSMS.includes(symptom.toUpperCase())) {
        data.symptoms.push(symptom);
      }
    }

    // Extract case count
    const caseMatch = sms.match(/(\d+)\s*(cases?|people?|persons?|log)/i);
    if (caseMatch) {
      data.cases = parseInt(caseMatch[1]);
    }

    // Extract village (look for known patterns)
    const villageMatch = sms.match(/(?:village|gaon|gram)\s*[:\-]?\s*(\w+)/i);
    if (villageMatch) {
      data.village = villageMatch[1];
    }

    data.notes = sms;

    return data.symptoms.length > 0 || data.cases ? data : { notes: sms };
  } catch (error) {
    console.error('Error parsing SMS report:', error);
    return { notes: sms };
  }
}
