import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABLE_NAME = "signup_error_logs";
const MAX_LIMIT = 100;

type Action = "list" | "delete" | "clear_all";

function getRequestMeta(req: Request) {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;
  return { ipAddress, userAgent };
}

async function logAdminAccess(params: {
  supabaseAdmin: any;
  userId: string;
  operation: string;
  recordId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}) {
  const {
    supabaseAdmin,
    userId,
    operation,
    recordId,
    ipAddress,
    userAgent,
    oldValues,
    newValues,
  } = params;

  try {
    await supabaseAdmin.from("admin_access_audit_log").insert({
      user_id: userId,
      table_name: TABLE_NAME,
      operation,
      record_id: recordId,
      ip_address: ipAddress,
      user_agent: userAgent,
      old_values: oldValues || null,
      new_values: newValues || null,
    });
  } catch (err) {
    console.error("Failed to write admin access audit log:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: 60 req/min per IP
  const rateLimitResponse = rateLimitMiddleware(
    req,
    { maxRequests: 60, windowMs: 60_000, identifier: "admin-signup-error-logs" },
    corsHeaders
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
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

    // Verify admin role using service key (bypasses RLS)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action: Action =
      body?.action === "delete" || body?.action === "clear_all" ? body.action : "list";

    if (action === "list") {
      const rawLimit = Number(body?.limit ?? 100);
      const rawOffset = Number(body?.offset ?? 0);
      const limit = Number.isFinite(rawLimit)
        ? Math.max(1, Math.min(MAX_LIMIT, Math.trunc(rawLimit)))
        : 100;
      const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.trunc(rawOffset)) : 0;

      await logAdminAccess({
        supabaseAdmin,
        userId: user.id,
        operation: "SELECT_LIST",
        recordId: null,
        ipAddress,
        userAgent,
        newValues: { limit, offset },
      });

      const from = offset;
      const to = offset + limit - 1;

      const { data, error } = await supabaseAdmin
        .from(TABLE_NAME)
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return new Response(JSON.stringify({ data: data ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const id = typeof body?.id === "string" ? body.id : "";
      if (!id) {
        return new Response(JSON.stringify({ error: "ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: oldRow } = await supabaseAdmin
        .from(TABLE_NAME)
        .select("id,email,first_name,last_name,error_code,created_at")
        .eq("id", id)
        .maybeSingle();

      await logAdminAccess({
        supabaseAdmin,
        userId: user.id,
        operation: "DELETE",
        recordId: id,
        ipAddress,
        userAgent,
        oldValues: oldRow || { id },
      });

      const { error } = await supabaseAdmin.from(TABLE_NAME).delete().eq("id", id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "clear_all") {
      await logAdminAccess({
        supabaseAdmin,
        userId: user.id,
        operation: "DELETE_ALL",
        recordId: null,
        ipAddress,
        userAgent,
      });

      // PostgREST requires a filter; this safely matches all rows.
      const { error } = await supabaseAdmin
        .from(TABLE_NAME)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("admin-signup-error-logs error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
