/**
 * Cron authentication utility
 * Validates the X-Cron-Secret header for scheduled cron jobs
 * Also allows authenticated admin users to call cron endpoints
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

export interface CronAuthResult {
  authorized: boolean;
  response?: Response;
  isAdmin?: boolean;
}

/**
 * Validates the cron secret from the request header
 * OR verifies the user is an authenticated admin
 * Returns an unauthorized response if both validations fail
 */
export const validateCronSecret = async (req: Request): Promise<CronAuthResult> => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const requestSecret = req.headers.get("X-Cron-Secret");
  
  // Check cron secret first (for pg_cron scheduled calls)
  if (cronSecret && requestSecret === cronSecret) {
    return { authorized: true, isAdmin: false };
  }
  
  // If no cron secret match, check for admin authentication
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (roleData) {
          return { authorized: true, isAdmin: true };
        }
      }
    } catch (err) {
      console.error("Admin auth check failed:", err);
    }
  }
  
  // If no secret configured and no valid admin auth, allow for backward compatibility
  if (!cronSecret) {
    console.warn("CRON_SECRET not configured - skipping cron authentication");
    return { authorized: true };
  }

  console.error("Cron authentication failed: Invalid or missing X-Cron-Secret header and no valid admin auth");
  return {
    authorized: false,
    response: new Response(
      JSON.stringify({ error: "Unauthorized - Invalid cron secret or admin credentials" }),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    ),
  };
};

export { corsHeaders };
