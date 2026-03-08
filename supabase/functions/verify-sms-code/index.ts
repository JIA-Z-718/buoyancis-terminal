import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hash function to verify code
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface VerifyCodeRequest {
  code: string;
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

    const { code, purpose }: VerifyCodeRequest = await req.json();

    if (!code || !purpose) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find valid verification code
    const { data: verificationCodes, error: fetchError } = await adminClient
      .from("sms_verification_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("purpose", purpose)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error("Error fetching verification codes:", fetchError);
      throw new Error("Failed to verify code");
    }

    if (!verificationCodes || verificationCodes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid verification code found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the provided code and check against stored hashes
    const codeHash = await hashCode(code);
    const matchingCode = verificationCodes.find((vc) => vc.code_hash === codeHash);

    if (!matchingCode) {
      // Increment attempts on most recent code
      const latestCode = verificationCodes[0];
      const newAttempts = latestCode.attempts + 1;

      await adminClient
        .from("sms_verification_codes")
        .update({ attempts: newAttempts })
        .eq("id", latestCode.id);

      if (newAttempts >= latestCode.max_attempts) {
        // Mark as used (exhausted)
        await adminClient
          .from("sms_verification_codes")
          .update({ used_at: new Date().toISOString() })
          .eq("id", latestCode.id);

        return new Response(
          JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: "Invalid code", 
          attemptsRemaining: latestCode.max_attempts - newAttempts 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark code as used
    await adminClient
      .from("sms_verification_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", matchingCode.id);

    // Handle phone verification purpose
    if (purpose === "phone_verification") {
      // Update or insert phone number as verified
      // Extract country code and phone number more reliably
      const phoneMatch = matchingCode.phone_number.match(/^(\+\d{1,4})(.+)$/);
      const extractedCountryCode = phoneMatch?.[1] || "+1";
      const extractedPhoneNumber = phoneMatch?.[2] || matchingCode.phone_number;

      const { error: upsertError } = await adminClient
        .from("user_phone_numbers")
        .upsert({
          user_id: user.id,
          phone_number: extractedPhoneNumber,
          country_code: extractedCountryCode,
          is_verified: true,
          verified_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Error updating phone number:", upsertError);
        throw new Error("Failed to verify phone number");
      }

      // Log verification event
      await adminClient.from("mfa_verification_events").insert({
        user_id: user.id,
        method: "sms",
        success: true,
      });

      console.log(`Phone number verified for user ${user.id}`);
    }

    // Handle MFA login purpose
    if (purpose === "mfa_login") {
      // Log verification event
      await adminClient.from("mfa_verification_events").insert({
        user_id: user.id,
        method: "sms",
        success: true,
      });

      console.log(`SMS MFA verification successful for user ${user.id}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Verification successful" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in verify-sms-code:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
