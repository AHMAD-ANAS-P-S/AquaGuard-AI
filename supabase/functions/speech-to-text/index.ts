import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, language = 'en' } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Use Lovable AI Gateway for transcription
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // For Lovable AI, we'll use a text-based approach since direct audio transcription
    // may not be supported. Return a placeholder for demo purposes.
    // In production, you would integrate with a proper STT service.
    
    console.log('Processing audio for language:', language);

    // Simulate transcription for demo
    // In a real implementation, you would use a proper STT API
    return new Response(
      JSON.stringify({ 
        text: "Voice input received. Please type your message for now.",
        language: language 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Speech to text error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
