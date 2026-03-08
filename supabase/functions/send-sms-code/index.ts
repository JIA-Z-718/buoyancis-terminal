import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simple hash function for code storage
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface SendCodeRequest {
  phoneNumber: string;
  countryCode: string;
  purpose: "phone_verification" | "mfa_login";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const messagebirdApiKey = Deno.env.get("MESSAGEBIRD_API_KEY");

    if (!messagebirdApiKey) {
      throw new Error("MESSAGEBIRD_API_KEY is not configured");
    }

    // Verify the user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phoneNumber, countryCode, purpose }: SendCodeRequest = await req.json();

    if (!phoneNumber || !countryCode || !purpose) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone number (ensure it starts with +)
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, "")}`;

    // Rate limit: max 3 codes per hour per user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCodes } = await adminClient
      .from("sms_verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if ((recentCodes || 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many verification codes requested. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate code and hash
    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the code
    const { error: insertError } = await adminClient
      .from("sms_verification_codes")
      .insert({
        user_id: user.id,
        phone_number: fullPhoneNumber,
        code_hash: codeHash,
        purpose,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification code:", insertError);
      throw new Error("Failed to generate verification code");
    }

    // Send SMS via MessageBird
    const messagebirdResponse = await fetch("https://rest.messagebird.com/messages", {
      method: "POST",
      headers: {
        "Authorization": `AccessKey ${messagebirdApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originator: "Buoyancis",
        recipients: [fullPhoneNumber],
        body: `Your Buoyancis verification code is: ${code}. This code expires in 10 minutes.`,
      }),
    });

    if (!messagebirdResponse.ok) {
      const errorData = await messagebirdResponse.text();
      console.error("MessageBird error:", errorData);
      
      // Clean up the unused code
      await adminClient
        .from("sms_verification_codes")
        .delete()
        .eq("user_id", user.id)
        .eq("code_hash", codeHash);

      throw new Error("Failed to send SMS");
    }

    console.log(`SMS code sent to ${fullPhoneNumber} for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent",
        expiresAt: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-sms-code:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
