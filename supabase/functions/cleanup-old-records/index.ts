import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface CleanupResult {
  table: string;
  deleted_count: number;
  retention_days: number;
}

interface RetentionSetting {
  table_name: string;
  retention_days: number;
  is_enabled: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for options
    let dryRun = false;
    let targetTable: string | null = null;
    try {
      const body = await req.json();
      dryRun = body?.dry_run === true;
      targetTable = body?.table_name || null;
    } catch {
      // No body or invalid JSON, continue with defaults
    }

    // Validate target table if specified
    const allowedTables = [
      "bot_detection_events",
      "rate_limit_violations", 
      "signup_error_logs",
      "cron_failure_notifications"
    ];
    
    if (targetTable && !allowedTables.includes(targetTable)) {
      return new Response(
        JSON.stringify({ error: `Invalid table name: ${targetTable}. Allowed tables: ${allowedTables.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate cron secret for scheduled execution (skip for dry run preview)
    if (!dryRun) {
      const cronValidation = await validateCronSecret(req);
      if (!cronValidation.authorized) {
        console.error("Cron secret validation failed");
        return cronValidation.response!;
      }
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: CleanupResult[] = [];
    const now = new Date();

    // Fetch retention settings from database
    const { data: settings, error: settingsError } = await supabase
      .from("data_retention_settings")
      .select("table_name, retention_days, is_enabled");

    if (settingsError) {
      console.error("Error fetching retention settings:", settingsError);
      throw new Error("Failed to fetch retention settings");
    }

    // Create a map for quick lookup with defaults
    const defaultSettings: Record<string, RetentionSetting> = {
      bot_detection_events: { table_name: "bot_detection_events", retention_days: 90, is_enabled: true },
      rate_limit_violations: { table_name: "rate_limit_violations", retention_days: 30, is_enabled: true },
      signup_error_logs: { table_name: "signup_error_logs", retention_days: 30, is_enabled: true },
      cron_failure_notifications: { table_name: "cron_failure_notifications", retention_days: 30, is_enabled: true },
    };

    // Merge database settings with defaults
    const retentionMap: Record<string, RetentionSetting> = { ...defaultSettings };
    if (settings) {
      for (const setting of settings) {
        retentionMap[setting.table_name] = setting;
      }
    }

    // Helper function to check if we should process a table
    const shouldProcessTable = (tableName: string) => {
      return targetTable === null || targetTable === tableName;
    };

    // 1. Clean up bot_detection_events
    const botSettings = retentionMap.bot_detection_events;
    if (botSettings.is_enabled && shouldProcessTable("bot_detection_events")) {
      const botDetectionCutoff = new Date(now);
      botDetectionCutoff.setDate(botDetectionCutoff.getDate() - botSettings.retention_days);
      
      if (dryRun) {
        // Count only for dry run
        const { count, error: countError } = await supabase
          .from("bot_detection_events")
          .select("*", { count: "exact", head: true })
          .lt("created_at", botDetectionCutoff.toISOString());

        if (!countError) {
          results.push({
            table: "bot_detection_events",
            deleted_count: count || 0,
            retention_days: botSettings.retention_days,
          });
        }
      } else {
        const { data: botData, error: botError } = await supabase
          .from("bot_detection_events")
          .delete()
          .lt("created_at", botDetectionCutoff.toISOString())
          .select("id");

        if (botError) {
          console.error("Error cleaning bot_detection_events:", botError);
        } else {
          results.push({
            table: "bot_detection_events",
            deleted_count: botData?.length || 0,
            retention_days: botSettings.retention_days,
          });
          console.log(`Deleted ${botData?.length || 0} records from bot_detection_events (>${botSettings.retention_days} days)`);
        }
      }
    } else if (!shouldProcessTable("bot_detection_events")) {
      // Table filtered out by targetTable parameter
    } else {
      console.log("Skipping bot_detection_events cleanup (disabled)");
    }

    // 2. Clean up rate_limit_violations
    const rateSettings = retentionMap.rate_limit_violations;
    if (rateSettings.is_enabled && shouldProcessTable("rate_limit_violations")) {
      const rateLimitCutoff = new Date(now);
      rateLimitCutoff.setDate(rateLimitCutoff.getDate() - rateSettings.retention_days);
      
      if (dryRun) {
        const { count, error: countError } = await supabase
          .from("rate_limit_violations")
          .select("*", { count: "exact", head: true })
          .lt("created_at", rateLimitCutoff.toISOString());

        if (!countError) {
          results.push({
            table: "rate_limit_violations",
            deleted_count: count || 0,
            retention_days: rateSettings.retention_days,
          });
        }
      } else {
        const { data: rateData, error: rateError } = await supabase
          .from("rate_limit_violations")
          .delete()
          .lt("created_at", rateLimitCutoff.toISOString())
          .select("id");

        if (rateError) {
          console.error("Error cleaning rate_limit_violations:", rateError);
        } else {
          results.push({
            table: "rate_limit_violations",
            deleted_count: rateData?.length || 0,
            retention_days: rateSettings.retention_days,
          });
          console.log(`Deleted ${rateData?.length || 0} records from rate_limit_violations (>${rateSettings.retention_days} days)`);
        }
      }
    } else if (!shouldProcessTable("rate_limit_violations")) {
      // Table filtered out by targetTable parameter
    } else {
      console.log("Skipping rate_limit_violations cleanup (disabled)");
    }

    // 3. Clean up signup_error_logs
    const signupSettings = retentionMap.signup_error_logs;
    if (signupSettings.is_enabled && shouldProcessTable("signup_error_logs")) {
      const signupErrorCutoff = new Date(now);
      signupErrorCutoff.setDate(signupErrorCutoff.getDate() - signupSettings.retention_days);
      
      if (dryRun) {
        const { count, error: countError } = await supabase
          .from("signup_error_logs")
          .select("*", { count: "exact", head: true })
          .lt("created_at", signupErrorCutoff.toISOString());

        if (!countError) {
          results.push({
            table: "signup_error_logs",
            deleted_count: count || 0,
            retention_days: signupSettings.retention_days,
          });
        }
      } else {
        const { data: signupData, error: signupError } = await supabase
          .from("signup_error_logs")
          .delete()
          .lt("created_at", signupErrorCutoff.toISOString())
          .select("id");

        if (signupError) {
          console.error("Error cleaning signup_error_logs:", signupError);
        } else {
          results.push({
            table: "signup_error_logs",
            deleted_count: signupData?.length || 0,
            retention_days: signupSettings.retention_days,
          });
          console.log(`Deleted ${signupData?.length || 0} records from signup_error_logs (>${signupSettings.retention_days} days)`);
        }
      }
    } else if (!shouldProcessTable("signup_error_logs")) {
      // Table filtered out by targetTable parameter
    } else {
      console.log("Skipping signup_error_logs cleanup (disabled)");
    }

    // 4. Clean up cron_failure_notifications
    const cronSettings = retentionMap.cron_failure_notifications;
    if (cronSettings.is_enabled && shouldProcessTable("cron_failure_notifications")) {
      const cronNotifCutoff = new Date(now);
      cronNotifCutoff.setDate(cronNotifCutoff.getDate() - cronSettings.retention_days);
      
      if (dryRun) {
        const { count, error: countError } = await supabase
          .from("cron_failure_notifications")
          .select("*", { count: "exact", head: true })
          .lt("notified_at", cronNotifCutoff.toISOString());

        if (!countError) {
          results.push({
            table: "cron_failure_notifications",
            deleted_count: count || 0,
            retention_days: cronSettings.retention_days,
          });
        }
      } else {
        const { data: cronNotifData, error: cronNotifError } = await supabase
          .from("cron_failure_notifications")
          .delete()
          .lt("notified_at", cronNotifCutoff.toISOString())
          .select("id");

        if (cronNotifError) {
          console.error("Error cleaning cron_failure_notifications:", cronNotifError);
        } else {
          results.push({
            table: "cron_failure_notifications",
            deleted_count: cronNotifData?.length || 0,
            retention_days: cronSettings.retention_days,
          });
          console.log(`Deleted ${cronNotifData?.length || 0} records from cron_failure_notifications (>${cronSettings.retention_days} days)`);
        }
      }
    } else if (!shouldProcessTable("cron_failure_notifications")) {
      // Table filtered out by targetTable parameter
    } else {
      console.log("Skipping cron_failure_notifications cleanup (disabled)");
    }

    // Log to notification_history for audit trail (only for actual cleanup, not dry run)
    const totalDeleted = results.reduce((sum, r) => sum + r.deleted_count, 0);
    
    if (!dryRun && totalDeleted > 0) {
      // Create detailed subject with table breakdown
      const tableBreakdown = results
        .filter(r => r.deleted_count > 0)
        .map(r => `${r.table}:${r.deleted_count}`)
        .join("|");
      
      const subject = targetTable 
        ? `Data retention cleanup (${targetTable}): ${totalDeleted} records removed [${tableBreakdown}]`
        : `Data retention cleanup: ${totalDeleted} records removed [${tableBreakdown}]`;
      
      await supabase.from("notification_history").insert({
        notification_type: "data_retention_cleanup",
        recipients: ["system"],
        subject,
        status: "success",
        triggered_by: null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        message: dryRun ? "Dry run preview completed" : "Data retention cleanup completed",
        timestamp: now.toISOString(),
        results,
        total_deleted: totalDeleted,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Data retention cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
