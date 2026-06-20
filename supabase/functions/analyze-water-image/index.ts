import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageType, notes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = imageType === 'pathogen'
      ? `You are a water quality microbiologist. Analyze this microscopic image for waterborne pathogens. Identify any visible organisms (bacteria, protozoa, parasites). ${notes ? `Observer notes: ${notes}` : ''} Return JSON with: riskLevel (low/medium/high), confidence (0-1), summary (2-3 sentences), contaminants (array of detected organisms), recommendations (array of action items).`
      : `You are a water quality expert. Analyze this image of a water body for contamination indicators. Look for: algal blooms, discoloration, turbidity, debris, sewage indicators. ${notes ? `Observer notes: ${notes}` : ''} Return JSON with: riskLevel (low/medium/high), confidence (0-1), summary (2-3 sentences), contaminants (array of issues found), recommendations (array of action items).`;

    const response = await fetch('https://ai.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        riskLevel: 'medium',
        confidence: 0.5,
        summary: content,
        contaminants: [],
        recommendations: ['Manual inspection recommended'],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
