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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const step = body?.step;
    const credential = body?.credential;
    const sessionId = body?.sessionId;

    // Get RP ID from the request origin or use default
    const origin = req.headers.get("origin") || "https://buoyancis.com";
    const rpId = new URL(origin).hostname;

    if (step === "options") {
      // Generate authentication options for passwordless login
      // This doesn't require a user to be authenticated
      const challenge = generateChallenge();

      // Store the challenge without a user_id (for passwordless flow)
      // We'll use a temporary session identifier
      const newSessionId = crypto.randomUUID();

      // Cleanup any expired passwordless challenges (defense-in-depth)
      await supabase
        .from("passkey_challenges")
        .delete()
        .is("user_id", null)
        .eq("type", "passwordless_login")
        .lt("expires_at", new Date().toISOString());

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from("passkey_challenges").insert({
        session_id: newSessionId,
        user_id: null, // No user yet for passwordless login
        challenge,
        type: "passwordless_login",
        expires_at: expiresAt,
      });

      // Return authentication options
      // Note: No allowCredentials means the browser will show all available passkeys for this RP
      const options = {
        challenge,
        rpId,
        timeout: 60000,
        userVerification: "preferred",
        // Empty allowCredentials lets the browser show discoverable credentials
        allowCredentials: [],
      };

      return new Response(
        JSON.stringify({ ...options, sessionId: newSessionId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (step === "verify") {
      // Verify the authentication response for passwordless login
      if (!credential) {
        return new Response(
          JSON.stringify({ error: "Missing credential" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!sessionId || typeof sessionId !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing sessionId" }),
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

      // Find the stored credential by credential_id
      const { data: storedCred, error: storedError } = await supabase
        .from("passkey_credentials")
        .select("*")
        .eq("credential_id", credentialId)
        .single();

      if (storedError || !storedCred) {
        return new Response(
          JSON.stringify({ error: "Passkey not found. Please sign in with email and password." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the passwordless login challenge for this session
      const { data: challengeData, error: challengeError } = await supabase
        .from("passkey_challenges")
        .select("challenge, expires_at")
        .is("user_id", null)
        .eq("type", "passwordless_login")
        .eq("session_id", sessionId)
        .single();

      if (challengeError || !challengeData) {
        return new Response(
          JSON.stringify({ error: "Challenge not found or expired. Please try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Explicit expiry validation (do not rely on DB defaults)
      const expiresAt = new Date(challengeData.expires_at);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        // Cleanup the expired challenge for this session
        await supabase
          .from("passkey_challenges")
          .delete()
          .is("user_id", null)
          .eq("type", "passwordless_login")
          .eq("session_id", sessionId);

        return new Response(
          JSON.stringify({ error: "Challenge expired. Please try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          JSON.stringify({ error: "Challenge mismatch. Please try again." }),
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
        // Log but don't block - some authenticators don't increment properly
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
        .is("user_id", null)
        .eq("type", "passwordless_login")
        .eq("session_id", sessionId);

      // Get the user's email from auth.users using the user_id from the credential
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(
        storedCred.user_id
      );

      if (authUserError || !authUser?.user?.email) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a magic link for the user to complete sign-in
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: authUser.user.email,
        options: {
          redirectTo: `${origin}/admin`,
        },
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        console.error("Error generating magic link:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to generate login session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return the email and token for client-side OTP verification
      return new Response(
        JSON.stringify({
          success: true,
          email: authUser.user.email,
          token: linkData.properties.hashed_token,
          type: "magiclink",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid step" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in passkey-login:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
