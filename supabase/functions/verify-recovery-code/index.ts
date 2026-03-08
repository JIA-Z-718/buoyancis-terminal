import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeCode(code: string): string {
  return code.replace(/-/g, "").toUpperCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code : "";
    if (!code || code.length > 64) {
      return new Response(JSON.stringify({ success: false, error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce rate limiting server-side (defense-in-depth)
    const { data: rlData, error: rlError } = await supabaseUser.rpc(
      "check_recovery_code_rate_limit",
      { p_user_id: user.id }
    );
    if (!rlError) {
      const rl = rlData?.[0];
      if (rl && rl.allowed === false) {
        return new Response(
          JSON.stringify({
            success: false,
            rateLimited: true,
            retryAfterSeconds: rl.retry_after_seconds ?? 0,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch unused code hashes (hashes are never exposed to the client)
    const { data: rows, error: fetchError } = await supabaseAdmin
      .from("mfa_recovery_codes")
      .select("id, mfa_recovery_code_secrets(code_hash)")
      .eq("user_id", user.id)
      .is("used_at", null);

    if (fetchError) throw fetchError;

    const normalized = normalizeCode(code);
    let matchedId: string | null = null;

    for (const row of (rows || []) as any[]) {
      const nested = row?.mfa_recovery_code_secrets;
      const codeHash = Array.isArray(nested)
        ? nested[0]?.code_hash
        : nested?.code_hash;

      if (!codeHash) continue;
      if (await compare(normalized, codeHash)) {
        matchedId = row.id;
        break;
      }
    }

    if (!matchedId) {
      await supabaseUser.rpc("record_recovery_code_attempt", {
        p_user_id: user.id,
        p_success: false,
      });

      return new Response(
        JSON.stringify({ success: false, error: "Invalid or already used recovery code" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("mfa_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", matchedId);
    if (updateError) throw updateError;

    await supabaseUser.rpc("record_recovery_code_attempt", {
      p_user_id: user.id,
      p_success: true,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("verify-recovery-code error:", message);
    return new Response(JSON.stringify({ success: false, error: "Verification failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
