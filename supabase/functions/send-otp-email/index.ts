import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }

    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('ALERT_FROM_EMAIL') || 'healthdepartment20@outlook.com';

    if (!sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: fromEmail, name: 'AquaGuard AI' },
        subject: `🔐 AquaGuard AI - Your Verification Code: ${otp}`,
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #0a1628, #0f2040); border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #4db8ff; font-size: 28px; margin: 0;">AquaGuard AI</h1>
                  <p style="color: #8899aa; font-size: 14px;">Government-Grade MFA Verification</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(77,184,255,0.2); border-radius: 12px; padding: 24px; text-align: center;">
                  <p style="color: #ccddee; font-size: 14px; margin-bottom: 16px;">Your secure verification code is:</p>
                  <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4db8ff; background: rgba(77,184,255,0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    ${otp}
                  </div>
                  <p style="color: #8899aa; font-size: 12px;">This code expires in 5 minutes. Do not share it with anyone.</p>
                </div>
                <p style="color: #556677; font-size: 11px; text-align: center; margin-top: 20px;">
                  If you didn't request this code, please ignore this email.<br/>
                  © AquaGuard AI - Smart Community Health Monitoring & Early Warning System for Water-Borne Diseases
                </p>
              </div>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
      throw new Error(`Failed to send email: ${response.status}`);
    }

    console.log('OTP email sent to:', email);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
