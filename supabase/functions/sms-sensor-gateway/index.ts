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

    console.log('Received SMS from:', from, 'Body:', body);

    // Parse sensor data from SMS
    // Expected format: SENSOR:ID123|PH:7.2|TDS:450|TURB:3.5|TEMP:25.5|BAT:85
    const data = parseSensorSMS(body);

    if (!data) {
      throw new Error('Invalid SMS format');
    }

    // Forward to sensor data handler
    const { data: result, error } = await supabase.functions.invoke('iot-sensor-data', {
      body: {
        ...data,
        communication_mode: 'gsm',
      }
    });

    if (error) {
      console.error('Error processing sensor data:', error);
      throw error;
    }

    console.log('Sensor data processed successfully:', result);

    // Respond to Twilio (required for webhook)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Data received</Message></Response>',
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/xml' 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing SMS:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error processing data</Message></Response>',
      { 
        status: 200, // Twilio needs 200 even for errors
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/xml' 
        } 
      }
    );
  }
});

function parseSensorSMS(sms: string): any {
  try {
    const parts = sms.split('|');
    const data: any = {};

    for (const part of parts) {
      const [key, value] = part.split(':');
      switch (key.trim().toUpperCase()) {
        case 'SENSOR':
          data.sensor_id = value.trim();
          break;
        case 'PH':
          data.ph = parseFloat(value);
          break;
        case 'TDS':
          data.tds = parseFloat(value);
          break;
        case 'TURB':
          data.turbidity = parseFloat(value);
          break;
        case 'TEMP':
          data.temperature = parseFloat(value);
          break;
        case 'BAT':
          data.battery_level = parseInt(value);
          break;
      }
    }

    if (!data.sensor_id) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error parsing SMS:', error);
    return null;
  }
}
