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

// Helper to convert ArrayBuffer or Uint8Array to base64url
function bufferToBase64url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes))
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

    const { step, credential, friendlyName } = await req.json();

    // Get RP ID from the request origin or use default
    const origin = req.headers.get("origin") || "https://buoyancis.com";
    const rpId = new URL(origin).hostname;

    if (step === "options") {
      // Generate registration options
      const challenge = generateChallenge();

      // Get existing credentials for this user to exclude
      const { data: existingCreds } = await supabase
        .from("passkey_credentials")
        .select("credential_id")
        .eq("user_id", user.id);

      const excludeCredentials = (existingCreds || []).map((c) => ({
        type: "public-key",
        id: c.credential_id,
      }));

      // Store the challenge
      await supabase.from("passkey_challenges").insert({
        user_id: user.id,
        challenge,
        type: "registration",
      });

      // Return registration options
      const options = {
        challenge,
        rp: {
          name: "Buoyancis Admin",
          id: rpId,
        },
        user: {
          id: bufferToBase64url(new TextEncoder().encode(user.id)),
          name: user.email || user.id,
          displayName: user.user_metadata?.display_name || user.email || "User",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        timeout: 60000,
        attestation: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "preferred",
        },
        excludeCredentials,
      };

      return new Response(
        JSON.stringify(options),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (step === "verify") {
      // Verify the registration response
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
        .eq("type", "registration")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !challengeData) {
        return new Response(
          JSON.stringify({ error: "Challenge not found or expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Basic validation of the credential response
      // In a production environment, you would use a proper WebAuthn library
      // For now, we'll do basic validation and store the credential
      
      const { id: credentialId, response: credResponse, type } = credential;

      if (type !== "public-key") {
        return new Response(
          JSON.stringify({ error: "Invalid credential type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decode and validate clientDataJSON
      const clientDataJSON = JSON.parse(
        new TextDecoder().decode(base64urlToBuffer(credResponse.clientDataJSON))
      );

      if (clientDataJSON.type !== "webauthn.create") {
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

      // Extract public key from attestationObject
      // This is a simplified version - production should use proper CBOR parsing
      const attestationObject = base64urlToBuffer(credResponse.attestationObject);

      // Store the credential
      const { error: insertError } = await supabase
        .from("passkey_credentials")
        .insert({
          user_id: user.id,
          credential_id: credentialId,
          public_key: attestationObject,
          counter: 0,
          device_type: credential.authenticatorAttachment || "platform",
          friendly_name: friendlyName || "Passkey",
          transports: credResponse.transports || [],
        });

      if (insertError) {
        console.error("Error storing credential:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to store credential" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Clean up the challenge
      await supabase
        .from("passkey_challenges")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "registration");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Passkey registered successfully",
          credentialId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid step" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in passkey-register:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
