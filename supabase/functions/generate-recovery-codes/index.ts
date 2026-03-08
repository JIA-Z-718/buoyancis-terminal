import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RECOVERY_CODE_COUNT = 10;
const CODE_LENGTH = 8;

function normalizeCode(code: string): string {
  return code.replace(/-/g, "").toUpperCase();
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar chars like 0/O, 1/I
  let code = "";
  const array = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[array[i] % chars.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Clear existing codes (secrets are deleted via FK cascade)
    const { error: deleteError } = await supabaseAdmin
      .from("mfa_recovery_codes")
      .delete()
      .eq("user_id", user.id);
    if (deleteError) throw deleteError;

    const codes: string[] = [];
    const metaRows: { id: string; user_id: string }[] = [];
    const secretRows: { recovery_code_id: string; code_hash: string }[] = [];

    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      const id = crypto.randomUUID();
      const code = generateCode();
      const normalized = normalizeCode(code);
      const codeHash = await hash(normalized);

      codes.push(code);
      metaRows.push({ id, user_id: user.id });
      secretRows.push({ recovery_code_id: id, code_hash: codeHash });
    }

    const { error: insertMetaError } = await supabaseAdmin
      .from("mfa_recovery_codes")
      .insert(metaRows);
    if (insertMetaError) throw insertMetaError;

    const { error: insertSecretsError } = await supabaseAdmin
      .from("mfa_recovery_code_secrets")
      .insert(secretRows);
    if (insertSecretsError) throw insertSecretsError;

    return new Response(JSON.stringify({ success: true, codes }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("generate-recovery-codes error:", message);
    return new Response(JSON.stringify({ error: "Failed to generate recovery codes" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
