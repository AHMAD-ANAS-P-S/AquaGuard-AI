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
    const { message, language = 'en', systemPrompt } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Processing health chatbot message:', message.substring(0, 50));

    // Get the system prompt for the language
    const prompt = systemPrompt || getDefaultSystemPrompt(language);
    
    // Generate a helpful response based on common health/water questions
    const response = generateHealthResponse(message, language);

    console.log('Response generated successfully');

    return new Response(
      JSON.stringify({ response, reply: response }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Health chatbot error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: getDefaultResponse('en')
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

function generateHealthResponse(message: string, language: string): string {
  const lowerMessage = message.toLowerCase();
  
  const responses: Record<string, Record<string, string>> = {
    water: {
      en: "For safe drinking water: 1) Boil water for 1 minute, 2) Use water purification tablets, 3) Store in clean covered containers. If water looks cloudy or smells bad, don't drink it.",
      hi: "सुरक्षित पीने के पानी के लिए: 1) पानी को 1 मिनट उबालें, 2) पानी शुद्धिकरण की गोलियों का उपयोग करें, 3) साफ ढके हुए बर्तनों में रखें। अगर पानी गंदा दिखे या बदबू आए, तो न पिएं।",
      as: "সুৰক্ষিত খোৱা পানীৰ বাবে: 1) পানী 1 মিনিট উতলাওক, 2) পানী শুদ্ধিকৰণ টেবলেট ব্যৱহাৰ কৰক, 3) পৰিষ্কাৰ ঢাকনি থকা পাত্ৰত ৰাখক।",
      bn: "নিরাপদ পানীয় জলের জন্য: 1) 1 মিনিট জল ফুটান, 2) জল পরিশোধন ট্যাবলেট ব্যবহার করুন, 3) পরিষ্কার ঢাকা পাত্রে সংরক্ষণ করুন।"
    },
    diarrhea: {
      en: "For diarrhea treatment: 1) Drink plenty of ORS (Oral Rehydration Solution), 2) Continue eating light foods, 3) Wash hands frequently. If symptoms persist for more than 2 days, visit the health center immediately.",
      hi: "दस्त के इलाज के लिए: 1) ORS (मौखिक पुनर्जलीकरण घोल) पिएं, 2) हल्का खाना खाते रहें, 3) बार-बार हाथ धोएं। अगर लक्षण 2 दिन से ज्यादा रहें, तुरंत स्वास्थ्य केंद्र जाएं।",
      as: "ডায়েৰিয়াৰ চিকিৎসাৰ বাবে: 1) প্ৰচুৰ ORS পান কৰক, 2) পাতল খাদ্য খাই থাকক, 3) সঘনাই হাত ধুওক। 2 দিনৰ বেছি হ'লে স্বাস্থ্য কেন্দ্ৰলৈ যাওক।",
      bn: "ডায়রিয়ার চিকিৎসার জন্য: 1) প্রচুর ORS পান করুন, 2) হালকা খাবার খেতে থাকুন, 3) ঘন ঘন হাত ধুতে থাকুন। 2 দিনের বেশি হলে স্বাস্থ্য কেন্দ্রে যান।"
    },
    fever: {
      en: "For fever: 1) Rest and drink plenty of fluids, 2) Take paracetamol if needed, 3) Use a cool wet cloth on forehead. If fever is above 103°F or lasts more than 3 days, seek medical help.",
      hi: "बुखार के लिए: 1) आराम करें और खूब तरल पदार्थ पिएं, 2) जरूरत हो तो पेरासिटामोल लें, 3) माथे पर ठंडा गीला कपड़ा रखें। अगर बुखार 103°F से ऊपर हो या 3 दिन से ज्यादा रहे, चिकित्सा सहायता लें।",
      as: "জ্বৰৰ বাবে: 1) জিৰণি লওক আৰু প্ৰচুৰ তৰল পদাৰ্থ পান কৰক, 2) প্ৰয়োজন হ'লে পেৰাচিটামল লওক, 3) কপালত ঠাণ্ডা তিতা কাপোৰ ৰাখক।",
      bn: "জ্বরের জন্য: 1) বিশ্রাম নিন এবং প্রচুর তরল পান করুন, 2) প্রয়োজনে প্যারাসিটামল নিন, 3) কপালে ঠান্ডা ভেজা কাপড় ব্যবহার করুন।"
    },
    mosquito: {
      en: "To prevent mosquito-borne diseases: 1) Use mosquito nets while sleeping, 2) Remove stagnant water around your home, 3) Use mosquito repellent. Report any fever with body ache to the health worker.",
      hi: "मच्छर जनित रोगों को रोकने के लिए: 1) सोते समय मच्छरदानी का उपयोग करें, 2) घर के आसपास से रुका हुआ पानी हटाएं, 3) मच्छर निरोधक का उपयोग करें।",
      as: "মহৰ দ্বাৰা হোৱা ৰোগ প্ৰতিৰোধ কৰিবলৈ: 1) শুওঁতে মহ জাল ব্যৱহাৰ কৰক, 2) ঘৰৰ চাৰিওফালৰ পৰা বন্ধ পানী আঁতৰাওক, 3) মহ নিৰোধক ব্যৱহাৰ কৰক।",
      bn: "মশাবাহিত রোগ প্রতিরোধে: 1) ঘুমানোর সময় মশারি ব্যবহার করুন, 2) বাড়ির আশেপাশে জমা জল সরান, 3) মশা নিরোধক ব্যবহার করুন।"
    },
    default: {
      en: "I'm Aqua, your health assistant. I can help with questions about water safety, diarrhea treatment, fever care, and disease prevention. What would you like to know?",
      hi: "मैं एक्वा हूं, आपका स्वास्थ्य सहायक। मैं पानी की सुरक्षा, दस्त के इलाज, बुखार की देखभाल और बीमारी की रोकथाम के बारे में मदद कर सकता हूं। आप क्या जानना चाहेंगे?",
      as: "মই একোয়া, আপোনাৰ স্বাস্থ্য সহায়ক। মই পানীৰ সুৰক্ষা, ডায়েৰিয়াৰ চিকিৎসা, জ্বৰৰ যত্ন আৰু ৰোগ প্ৰতিৰোধৰ বিষয়ে সহায় কৰিব পাৰো।",
      bn: "আমি একোয়া, আপনার স্বাস্থ্য সহায়ক। আমি জল নিরাপত্তা, ডায়রিয়ার চিকিৎসা, জ্বরের যত্ন এবং রোগ প্রতিরোধ সম্পর্কে সাহায্য করতে পারি।"
    }
  };

  // Detect topic
  let topic = 'default';
  if (lowerMessage.includes('water') || lowerMessage.includes('पानी') || lowerMessage.includes('পানী') || lowerMessage.includes('জল')) {
    topic = 'water';
  } else if (lowerMessage.includes('diarrhea') || lowerMessage.includes('loose') || lowerMessage.includes('दस्त') || lowerMessage.includes('ডায়েৰিয়া') || lowerMessage.includes('ডায়রিয়া')) {
    topic = 'diarrhea';
  } else if (lowerMessage.includes('fever') || lowerMessage.includes('बुखार') || lowerMessage.includes('জ্বৰ') || lowerMessage.includes('জ্বর')) {
    topic = 'fever';
  } else if (lowerMessage.includes('mosquito') || lowerMessage.includes('मच्छर') || lowerMessage.includes('মহ') || lowerMessage.includes('মশা')) {
    topic = 'mosquito';
  }

  return responses[topic][language] || responses[topic]['en'] || responses['default'][language] || responses['default']['en'];
}

function getDefaultSystemPrompt(language: string): string {
  const prompts: Record<string, string> = {
    en: "You are 'Aqua', a helpful water quality and health assistant for rural communities in India.",
    hi: "आप 'एक्वा' हैं, ग्रामीण भारतीय समुदायों के लिए एक सहायक जल गुणवत्ता और स्वास्थ्य सहायक।",
    as: "আপুনি 'একোয়া', গ্ৰাম্য ভাৰতীয় সম্প্ৰদায়ৰ বাবে এজন সহায়ক পানীৰ গুণমান আৰু স্বাস্থ্য সহায়ক।",
    bn: "আপনি 'একোয়া', গ্রামীণ ভারতীয় সম্প্রদায়ের জন্য একজন সহায়ক জল মান এবং স্বাস্থ্য সহায়ক।"
  };
  return prompts[language] || prompts.en;
}

function getDefaultResponse(language: string): string {
  const responses: Record<string, string> = {
    en: "I'm here to help with water quality and health questions. How can I assist you today?",
    hi: "मैं जल गुणवत्ता और स्वास्थ्य संबंधी प्रश्नों में मदद करने के लिए यहां हूं।",
    as: "মই পানীৰ গুণমান আৰু স্বাস্থ্য সম্পৰ্কীয় প্ৰশ্নত সহায় কৰিবলৈ ইয়াত আছো।",
    bn: "আমি জল মান এবং স্বাস্থ্য সম্পর্কিত প্রশ্নে সাহায্য করতে এখানে আছি।"
  };
  return responses[language] || responses.en;
}