import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TABLES = [
  "email_campaigns",
  "profiles",
  "user_roles",
  "email_templates",
  "scheduled_emails",
  "blog_posts",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

type RequestBody = {
  table?: AllowedTable | "all";
  limit?: number;
};

function isAllowedTable(value: unknown): value is AllowedTable {
  return typeof value === "string" && (ALLOWED_TABLES as readonly string[]).includes(value);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: 30 requests/min per IP (admin dashboard polling + manual refresh)
  const rateLimitResponse = rateLimitMiddleware(
    req,
    { maxRequests: 30, windowMs: 60_000, identifier: "admin-audit-logs" },
    corsHeaders
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce admin server-side (do not trust client state)
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

    const body = (await req.json().catch(() => ({}))) as Partial<RequestBody>;
    const table = body.table ?? "all";
    const limitRaw = body.limit ?? 50;
    const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? Number(limitRaw) : 50));

    let query = supabaseAdmin
      .from("admin_access_audit_log")
      // Intentionally exclude ip_address/user_agent to reduce sensitive data exposure
      .select("id,user_id,table_name,operation,record_id,old_values,new_values,created_at")
      .in("table_name", [...ALLOWED_TABLES])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (table !== "all") {
      if (!isAllowedTable(table)) {
        return new Response(JSON.stringify({ error: "Invalid table filter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.eq("table_name", table);
    }

    const { data, error } = await query;
    if (error) {
      console.error("admin-audit-logs query failed:", error);
      return new Response(JSON.stringify({ error: "Failed to load audit logs" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: data ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in admin-audit-logs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
