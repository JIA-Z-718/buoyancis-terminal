import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, jobId, limit, jobName, schedule, functionName } = await req.json();

    if (action === "create") {
      // Validate required fields
      if (!jobName || !schedule || !functionName) {
        return new Response(JSON.stringify({ error: "Missing required fields: jobName, schedule, functionName" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate job name (alphanumeric, hyphens, underscores only)
      const jobNameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!jobNameRegex.test(jobName) || jobName.length > 63) {
        return new Response(JSON.stringify({ error: "Job name must be alphanumeric (with hyphens/underscores) and max 63 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate cron schedule format (basic validation)
      const cronRegex = /^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/;
      if (!cronRegex.test(schedule)) {
        return new Response(JSON.stringify({ error: "Invalid cron schedule format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate function name (alphanumeric and hyphens only)
      const funcNameRegex = /^[a-zA-Z0-9-]+$/;
      if (!funcNameRegex.test(functionName) || functionName.length > 100) {
        return new Response(JSON.stringify({ error: "Function name must be alphanumeric with hyphens and max 100 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create the cron job using the database function
      const { data, error } = await supabaseAdmin.rpc("create_cron_job", {
        p_job_name: jobName,
        p_schedule: schedule,
        p_function_name: functionName,
      });

      if (error) {
        console.error("Error creating cron job:", error);
        throw new Error(`Failed to create cron job: ${error.message}`);
      }

      return new Response(JSON.stringify({ success: true, jobId: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update" && jobId && schedule) {
      // Validate cron schedule format
      const cronRegex = /^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/;
      if (!cronRegex.test(schedule)) {
        return new Response(JSON.stringify({ error: "Invalid cron schedule format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update the cron job schedule
      const { error } = await supabaseAdmin.rpc("update_cron_job_schedule", {
        p_job_id: jobId,
        p_schedule: schedule,
      });

      if (error) {
        console.error("Error updating cron job:", error);
        throw new Error(`Failed to update cron job: ${error.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      // List all cron jobs
      const { data, error } = await supabaseAdmin.rpc("get_cron_jobs");
      
      if (error) {
        console.error("Error fetching cron jobs:", error);
        throw new Error(`Failed to fetch cron jobs: ${error.message}`);
      }

      return new Response(JSON.stringify({ jobs: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "history") {
      // Get job run history
      const { data, error } = await supabaseAdmin.rpc("get_cron_job_history", {
        job_id_filter: jobId || null,
        limit_count: limit || 50,
      });
      
      if (error) {
        console.error("Error fetching job history:", error);
        throw new Error(`Failed to fetch job history: ${error.message}`);
      }

      return new Response(JSON.stringify({ history: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle" && jobId) {
      // Toggle job active state
      const { error } = await supabaseAdmin.rpc("toggle_cron_job", { job_id: jobId });
      
      if (error) {
        throw new Error(`Failed to toggle job: ${error.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete" && jobId) {
      // Delete the cron job
      const { error } = await supabaseAdmin.rpc("delete_cron_job", { job_id: jobId });
      
      if (error) {
        throw new Error(`Failed to delete job: ${error.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "run_now" && jobId) {
      // Manually trigger a job
      const { error } = await supabaseAdmin.rpc("run_cron_job_now", { job_id: jobId });
      
      if (error) {
        throw new Error(`Failed to run job: ${error.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in manage-cron-jobs:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
