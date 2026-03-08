import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Letter to concept mapping for the Buoyancis system
const LETTER_MAP: Record<string, { concept: string; conceptZh: string }> = {
  A: { concept: "Asset", conceptZh: "資產" },
  B: { concept: "Birth", conceptZh: "誕生" },
  C: { concept: "Care", conceptZh: "關懷" },
  D: { concept: "Duty", conceptZh: "責任" },
  E: { concept: "Energy", conceptZh: "能量" },
  F: { concept: "Flow", conceptZh: "流動" },
  G: { concept: "Growth", conceptZh: "成長" },
  H: { concept: "Harmony", conceptZh: "和諧" },
  I: { concept: "Integration", conceptZh: "整合" },
  J: { concept: "Justice", conceptZh: "正義" },
  K: { concept: "Knowledge", conceptZh: "知識" },
  L: { concept: "Leisure", conceptZh: "休閒" },
  M: { concept: "Matter", conceptZh: "物質" },
  N: { concept: "Network", conceptZh: "網絡" },
  O: { concept: "Order", conceptZh: "秩序" },
  P: { concept: "Power", conceptZh: "權力" },
  Q: { concept: "Quest", conceptZh: "探索" },
  R: { concept: "Resource", conceptZh: "資源" },
  S: { concept: "Service", conceptZh: "服務" },
  T: { concept: "Technology", conceptZh: "技術" },
  U: { concept: "Unity", conceptZh: "團結" },
  V: { concept: "Value", conceptZh: "價值" },
  W: { concept: "Wisdom", conceptZh: "智慧" },
  X: { concept: "Exchange", conceptZh: "交換" },
  Y: { concept: "Yield", conceptZh: "產出" },
  Z: { concept: "Zero", conceptZh: "歸零" },
  "0": { concept: "Void", conceptZh: "虛空" },
  "1": { concept: "Authority", conceptZh: "權威" },
  "2": { concept: "Duality", conceptZh: "二元" },
  "3": { concept: "Creation", conceptZh: "創造" },
  "4": { concept: "Foundation", conceptZh: "基礎" },
  "5": { concept: "Change", conceptZh: "變化" },
  "6": { concept: "Harmony", conceptZh: "和諧" },
  "7": { concept: "Mystery", conceptZh: "神秘" },
  "8": { concept: "Wealth", conceptZh: "財富" },
  "9": { concept: "Completion", conceptZh: "完成" },
  "#": { concept: "Education", conceptZh: "教育" },
  "@": { concept: "Connection", conceptZh: "連結" },
  "&": { concept: "Union", conceptZh: "聯合" },
  "$": { concept: "Currency", conceptZh: "貨幣" },
};

function decodeWord(word: string): string {
  const chars = word.toUpperCase().split("");
  const concepts: string[] = [];
  
  for (const char of chars) {
    if (char === " ") continue;
    const data = LETTER_MAP[char];
    if (data) {
      concepts.push(`${char}(${data.concept})`);
    }
  }
  
  return concepts.join(" → ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { word, saveToDb } = await req.json();
    
    if (!word || typeof word !== "string") {
      return new Response(
        JSON.stringify({ error: "Word is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const decodedString = decodeWord(word);

    // Generate analysis using AI
    const systemPrompt = `You are the oracle of the Buoyancis system - a philosophical framework that decodes words into structural meanings. Each letter maps to a concept:

A=Asset, B=Birth, C=Care, D=Duty, E=Energy, F=Flow, G=Growth, H=Harmony, I=Integration, J=Justice, K=Knowledge, L=Leisure, M=Matter, N=Network, O=Order, P=Power, Q=Quest, R=Resource, S=Service, T=Technology, U=Unity, V=Value, W=Wisdom, X=Exchange, Y=Yield, Z=Zero

Numbers: 0=Void, 1=Authority, 2=Duality, 3=Creation, 4=Foundation, 5=Change, 6=Harmony, 7=Mystery, 8=Wealth, 9=Completion
Symbols: #=Education, @=Connection, &=Union, $=Currency

Your role is to provide profound, poetic interpretations that reveal the hidden structural meaning within words. Write in a mystical yet grounded tone, as if unveiling cosmic truths hidden in everyday language.

IMPORTANT: Respond in JSON format with two fields:
- "interpretation": A single profound sentence (40-60 words) that captures the essence of the word's decoded meaning. Should be poetic and philosophical.
- "deep_analysis": A detailed analysis (100-150 words) exploring the structural relationships between the letters/concepts, their flow, and what this reveals about the word's true nature.`;

    const userPrompt = `Decode and analyze the word: "${word}"
Decoded structure: ${decodedString}

Provide your interpretation and deep analysis of how these concepts flow together to create meaning.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If JSON parsing fails, try to extract from the content
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse AI response");
    }

    const result = {
      word: word.toUpperCase(),
      decoded_string: decodedString,
      interpretation: parsed.interpretation || "",
      deep_analysis: parsed.deep_analysis || "",
    };

    // Optionally save to database
    if (saveToDb) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get authorization header to extract user
      const authHeader = req.headers.get("Authorization");
      let userId = null;
      
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      }

      const { error: insertError } = await supabase
        .from("daily_entropy_words")
        .insert({
          word: result.word,
          decoded_string: result.decoded_string,
          interpretation: result.interpretation,
          deep_analysis: result.deep_analysis,
          scheduled_date: new Date().toISOString().split("T")[0],
          created_by: userId,
        });

      if (insertError) {
        console.error("Failed to save to database:", insertError);
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-entropy-analysis:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
