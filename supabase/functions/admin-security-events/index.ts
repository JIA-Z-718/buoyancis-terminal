import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityEvent {
  id: string;
  event_type: string;
  category: string;
  severity: "info" | "warn" | "critical";
  description: string;
  user_id: string | null;
  user_email?: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
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
    const { action = "list", limit = 100, category } = body;

    switch (action) {
      case "list": {
        const events: SecurityEvent[] = [];

        // Fetch MFA verification events
        const { data: mfaEvents } = await supabaseAdmin
          .from("mfa_verification_events")
          .select("*")
          .order("verified_at", { ascending: false })
          .limit(limit);

        if (mfaEvents) {
          for (const event of mfaEvents) {
            events.push({
              id: event.id,
              event_type: event.success ? "mfa_verification_success" : "mfa_verification_failed",
              category: "mfa",
              severity: event.success ? "info" : "warn",
              description: `MFA ${event.method} verification ${event.success ? "succeeded" : "failed"}`,
              user_id: event.user_id,
              ip_address: event.ip_address,
              user_agent: event.user_agent,
              details: { method: event.method, success: event.success },
              created_at: event.verified_at,
            });
          }
        }

        // Fetch recovery code attempts
        const { data: recoveryAttempts } = await supabaseAdmin
          .from("recovery_code_attempts")
          .select("*")
          .order("attempted_at", { ascending: false })
          .limit(limit);

        if (recoveryAttempts) {
          for (const attempt of recoveryAttempts) {
            events.push({
              id: attempt.id,
              event_type: attempt.success ? "recovery_code_success" : "recovery_code_failed",
              category: "recovery",
              severity: attempt.success ? "info" : "warn",
              description: `Recovery code ${attempt.success ? "used successfully" : "failed"}`,
              user_id: attempt.user_id,
              ip_address: null,
              user_agent: null,
              details: { success: attempt.success },
              created_at: attempt.attempted_at,
            });
          }
        }

        // Fetch audit anomaly alerts (lockouts, suspicious activity)
        const { data: anomalyAlerts } = await supabaseAdmin
          .from("audit_anomaly_alerts")
          .select("*")
          .order("detected_at", { ascending: false })
          .limit(limit);

        if (anomalyAlerts) {
          for (const alert of anomalyAlerts) {
            events.push({
              id: alert.id,
              event_type: alert.alert_type,
              category: "anomaly",
              severity: alert.severity === "high" ? "critical" : alert.severity === "medium" ? "warn" : "info",
              description: alert.description,
              user_id: alert.user_id,
              ip_address: alert.ip_address,
              user_agent: null,
              details: alert.details as Record<string, unknown>,
              created_at: alert.detected_at,
            });
          }
        }

        // Fetch role changes from role_audit_log
        const { data: roleChanges } = await supabaseAdmin
          .from("role_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (roleChanges) {
          for (const change of roleChanges) {
            events.push({
              id: change.id,
              event_type: "role_change",
              category: "access_control",
              severity: "warn",
              description: `Role ${change.action}: ${change.role} for user`,
              user_id: change.user_id,
              ip_address: null,
              user_agent: null,
              details: { 
                action: change.action, 
                role: change.role, 
                target_user_id: change.target_user_id,
                performed_by: change.user_id 
              },
              created_at: change.created_at,
            });
          }
        }

        // Fetch MFA enrollment reminders (indicates users not enrolled)
        const { data: mfaReminders } = await supabaseAdmin
          .from("mfa_enrollment_reminders")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(limit);

        if (mfaReminders) {
          for (const reminder of mfaReminders) {
            events.push({
              id: reminder.id,
              event_type: "mfa_enrollment_reminder",
              category: "mfa",
              severity: "info",
              description: `MFA enrollment reminder sent (${reminder.reminder_type})`,
              user_id: reminder.user_id,
              user_email: reminder.user_email,
              ip_address: null,
              user_agent: null,
              details: { reminder_type: reminder.reminder_type, user_email: reminder.user_email },
              created_at: reminder.sent_at,
            });
          }
        }

        // Sort all events by created_at descending
        events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Filter by category if specified
        const filteredEvents = category && category !== "all" 
          ? events.filter(e => e.category === category)
          : events;

        return new Response(
          JSON.stringify({ data: filteredEvents.slice(0, limit) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "stats": {
        // Get counts for each category in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [mfaCount, recoveryCount, anomalyCount, roleCount] = await Promise.all([
          supabaseAdmin
            .from("mfa_verification_events")
            .select("*", { count: "exact", head: true })
            .gte("verified_at", oneDayAgo),
          supabaseAdmin
            .from("recovery_code_attempts")
            .select("*", { count: "exact", head: true })
            .gte("attempted_at", oneDayAgo),
          supabaseAdmin
            .from("audit_anomaly_alerts")
            .select("*", { count: "exact", head: true })
            .gte("detected_at", oneDayAgo),
          supabaseAdmin
            .from("role_audit_log")
            .select("*", { count: "exact", head: true })
            .gte("created_at", oneDayAgo),
        ]);

        // Get failed attempts counts
        const [failedMfa, failedRecovery] = await Promise.all([
          supabaseAdmin
            .from("mfa_verification_events")
            .select("*", { count: "exact", head: true })
            .eq("success", false)
            .gte("verified_at", oneDayAgo),
          supabaseAdmin
            .from("recovery_code_attempts")
            .select("*", { count: "exact", head: true })
            .eq("success", false)
            .gte("attempted_at", oneDayAgo),
        ]);

        return new Response(
          JSON.stringify({
            data: {
              total_events_24h: (mfaCount.count || 0) + (recoveryCount.count || 0) + (anomalyCount.count || 0) + (roleCount.count || 0),
              mfa_events: mfaCount.count || 0,
              recovery_attempts: recoveryCount.count || 0,
              anomaly_alerts: anomalyCount.count || 0,
              role_changes: roleCount.count || 0,
              failed_mfa: failedMfa.count || 0,
              failed_recovery: failedRecovery.count || 0,
            }
          }),
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
