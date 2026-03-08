import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret for scheduled invocations
    const cronSecret = Deno.env.get("CRON_SECRET");
    const requestCronSecret = req.headers.get("X-Cron-Secret");
    
    // Allow either cron secret or admin auth
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;
    
    if (cronSecret && requestCronSecret === cronSecret) {
      isAuthorized = true;
    }
    
    if (!isAuthorized && authHeader) {
      // Verify admin user
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        
        if (roleData) {
          isAuthorized = true;
        }
      }
    }
    
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    console.log(`Cleaning up export files older than ${cutoffTime.toISOString()}`);

    // List all files in the exports bucket
    const { data: folders, error: listFoldersError } = await supabase.storage
      .from("exports")
      .list("", { limit: 1000 });

    if (listFoldersError) {
      console.error("Error listing folders:", listFoldersError);
      throw new Error(`Failed to list folders: ${listFoldersError.message}`);
    }

    let deletedCount = 0;
    let errorCount = 0;
    const deletedFiles: string[] = [];

    // Iterate through user folders
    for (const folder of folders || []) {
      if (folder.id === null) {
        // This is a folder (user ID folder)
        const { data: files, error: listFilesError } = await supabase.storage
          .from("exports")
          .list(folder.name, { limit: 1000 });

        if (listFilesError) {
          console.error(`Error listing files in ${folder.name}:`, listFilesError);
          errorCount++;
          continue;
        }

        for (const file of files || []) {
          // Check if file is older than 24 hours
          const fileCreatedAt = new Date(file.created_at);
          
          if (fileCreatedAt < cutoffTime) {
            const filePath = `${folder.name}/${file.name}`;
            
            const { error: deleteError } = await supabase.storage
              .from("exports")
              .remove([filePath]);

            if (deleteError) {
              console.error(`Error deleting ${filePath}:`, deleteError);
              errorCount++;
            } else {
              console.log(`Deleted expired file: ${filePath}`);
              deletedFiles.push(filePath);
              deletedCount++;
            }
          }
        }
      }
    }

    // Log the cleanup result
    const summary = {
      success: true,
      deletedCount,
      errorCount,
      cutoffTime: cutoffTime.toISOString(),
      deletedFiles: deletedFiles.slice(0, 10), // Only include first 10 for brevity
    };

    console.log("Cleanup complete:", summary);

    // Log to notification history if any files were deleted
    if (deletedCount > 0) {
      await supabase.from("notification_history").insert({
        notification_type: "export_cleanup",
        recipients: ["system"],
        subject: `Cleaned up ${deletedCount} expired export files`,
        status: "sent",
        triggered_by: null,
      });
    }

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in cleanup-expired-exports:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
