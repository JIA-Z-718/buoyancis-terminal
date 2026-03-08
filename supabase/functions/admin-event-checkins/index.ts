import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABLE_NAME = "event_checkins";

// Helper to log PII access
async function logPiiAccess(
  supabaseAdmin: any,
  userId: string,
  operation: string,
  recordId: string | null,
  ipAddress: string | null,
  userAgent: string | null,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null
) {
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
  } catch (error) {
    console.error("Failed to log PII access:", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create client with user's auth to verify admin status
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Capture request metadata for audit
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("cf-connecting-ip") || null;
    const userAgent = req.headers.get("user-agent");

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using service role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action = "list", id, data: updateData } = body;

    switch (action) {
      case "list": {
        // Log PII access
        await logPiiAccess(supabaseAdmin, user.id, "SELECT_ALL", null, ipAddress, userAgent);

        const { data, error } = await supabaseAdmin
          .from("event_checkins")
          .select("*")
          .order("checked_in_at", { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        if (!updateData) {
          return new Response(
            JSON.stringify({ error: "Data required for create" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabaseAdmin
          .from("event_checkins")
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;

        // Log PII creation
        await logPiiAccess(supabaseAdmin, user.id, "INSERT", data.id, ipAddress, userAgent, null, updateData);

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!id || !updateData) {
          return new Response(
            JSON.stringify({ error: "ID and data required for update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch old values before update
        const { data: oldData } = await supabaseAdmin
          .from("event_checkins")
          .select("*")
          .eq("id", id)
          .single();

        const { data, error } = await supabaseAdmin
          .from("event_checkins")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        // Log PII update with before/after values
        await logPiiAccess(supabaseAdmin, user.id, "UPDATE", id, ipAddress, userAgent, oldData, updateData);

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!id) {
          return new Response(
            JSON.stringify({ error: "ID required for delete" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch old values before delete for audit
        const { data: oldData } = await supabaseAdmin
          .from("event_checkins")
          .select("*")
          .eq("id", id)
          .single();

        // Log PII deletion with old values
        await logPiiAccess(supabaseAdmin, user.id, "DELETE", id, ipAddress, userAgent, oldData, null);

        const { error } = await supabaseAdmin
          .from("event_checkins")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
