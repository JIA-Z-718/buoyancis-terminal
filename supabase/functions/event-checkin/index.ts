import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware, getClientIp } from "../_shared/rate-limiter.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckinRequest {
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: 5 requests per minute per IP
    const rateLimitResponse = rateLimitMiddleware(
      req,
      { maxRequests: 5, windowMs: 60000, identifier: "event-checkin" },
      corsHeaders
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse request body
    const body: CheckinRequest = await req.json();

    // Validate required fields
    if (!body.full_name || typeof body.full_name !== "string") {
      return new Response(
        JSON.stringify({ error: "Full name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullName = body.full_name.trim();
    if (fullName.length === 0 || fullName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Full name must be between 1 and 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate optional email
    let email: string | null = null;
    if (body.email && typeof body.email === "string") {
      email = body.email.trim();
      if (email.length > 255) {
        return new Response(
          JSON.stringify({ error: "Email must be less than 255 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Basic email format validation
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate optional phone
    let phone: string | null = null;
    if (body.phone && typeof body.phone === "string") {
      phone = body.phone.trim();
      if (phone.length > 20) {
        return new Response(
          JSON.stringify({ error: "Phone must be less than 20 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate optional company
    let company: string | null = null;
    if (body.company && typeof body.company === "string") {
      company = body.company.trim();
      if (company.length > 100) {
        return new Response(
          JSON.stringify({ error: "Company must be less than 100 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[event-checkin] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert check-in record
    const { data, error } = await supabase
      .from("event_checkins")
      .insert({
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        company: company || null,
      })
      .select("id, full_name, checked_in_at")
      .single();

    if (error) {
      console.error("[event-checkin] Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to complete check-in" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[event-checkin] Successful check-in: ${fullName} from IP: ${getClientIp(req)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Check-in successful",
        data: {
          id: data.id,
          full_name: data.full_name,
          checked_in_at: data.checked_in_at,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[event-checkin] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});