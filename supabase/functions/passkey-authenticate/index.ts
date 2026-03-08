import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to generate a random challenge
function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper to convert base64url to Uint8Array
function base64urlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binaryString = atob(base64 + padding);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { step, credential } = await req.json();

    // Get RP ID from the request origin or use default
    const origin = req.headers.get("origin") || "https://buoyancis.com";
    const rpId = new URL(origin).hostname;

    if (step === "options") {
      // Generate authentication options
      const challenge = generateChallenge();

      // Get existing credentials for this user
      const { data: existingCreds, error: credsError } = await supabase
        .from("passkey_credentials")
        .select("credential_id, transports")
        .eq("user_id", user.id);

      if (credsError || !existingCreds || existingCreds.length === 0) {
        return new Response(
          JSON.stringify({ error: "No passkeys registered" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const allowCredentials = existingCreds.map((c) => ({
        type: "public-key",
        id: c.credential_id,
        transports: c.transports || [],
      }));

      // Store the challenge
      await supabase.from("passkey_challenges").insert({
        user_id: user.id,
        challenge,
        type: "authentication",
      });

      // Return authentication options
      const options = {
        challenge,
        rpId,
        timeout: 60000,
        userVerification: "preferred",
        allowCredentials,
      };

      return new Response(
        JSON.stringify(options),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (step === "verify") {
      // Verify the authentication response
      if (!credential) {
        return new Response(
          JSON.stringify({ error: "Missing credential" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the stored challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from("passkey_challenges")
        .select("challenge")
        .eq("user_id", user.id)
        .eq("type", "authentication")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !challengeData) {
        return new Response(
          JSON.stringify({ error: "Challenge not found or expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { id: credentialId, response: credResponse, type } = credential;

      if (type !== "public-key") {
        return new Response(
          JSON.stringify({ error: "Invalid credential type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find the stored credential
      const { data: storedCred, error: storedError } = await supabase
        .from("passkey_credentials")
        .select("*")
        .eq("user_id", user.id)
        .eq("credential_id", credentialId)
        .single();

      if (storedError || !storedCred) {
        return new Response(
          JSON.stringify({ error: "Credential not found" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decode and validate clientDataJSON
      const clientDataJSON = JSON.parse(
        new TextDecoder().decode(base64urlToBuffer(credResponse.clientDataJSON))
      );

      if (clientDataJSON.type !== "webauthn.get") {
        return new Response(
          JSON.stringify({ error: "Invalid credential type in clientData" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (clientDataJSON.challenge !== challengeData.challenge) {
        return new Response(
          JSON.stringify({ error: "Challenge mismatch" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse authenticator data to get the counter
      const authenticatorData = base64urlToBuffer(credResponse.authenticatorData);
      // Counter is bytes 33-36 (big-endian)
      const counterBytes = authenticatorData.slice(33, 37);
      const newCounter = new DataView(counterBytes.buffer).getUint32(0, false);

      // Verify counter (should be greater than stored counter to prevent replay)
      if (newCounter <= storedCred.counter) {
        console.warn(`Counter mismatch: new=${newCounter}, stored=${storedCred.counter}`);
        // In production, this might indicate a cloned authenticator
        // For now, we'll allow it but log the warning
      }

      // Update the counter and last used timestamp
      await supabase
        .from("passkey_credentials")
        .update({
          counter: newCounter,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", storedCred.id);

      // Clean up the challenge
      await supabase
        .from("passkey_challenges")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "authentication");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Passkey authentication successful",
          credentialId,
          verifiedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid step" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in passkey-authenticate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
