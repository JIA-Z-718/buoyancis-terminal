import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailHistoryRequest {
  targetUserId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: authError } = await anonClient.auth.getUser();
    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { targetUserId }: EmailHistoryRequest = await req.json();

    if (!targetUserId) {
      throw new Error("Missing targetUserId");
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's email from auth.users
    const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(targetUserId);
    if (userError || !userData.user?.email) {
      throw new Error("User not found or has no email");
    }

    const targetEmail = userData.user.email;

    // Query notification history for emails sent to this user
    const { data: history, error: historyError } = await serviceClient
      .from("notification_history")
      .select("*")
      .contains("recipients", [targetEmail])
      .order("created_at", { ascending: false })
      .limit(50);

    if (historyError) {
      throw historyError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email: targetEmail,
        history: history || [] 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error fetching email history:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
