import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackClaimRequest {
  node_id: string;
  claimant_name: string;
  action: "VIEW" | "CLAIM" | "REJECT";
}

// Input validation constants
const MAX_NODE_ID_LENGTH = 50;
const MAX_CLAIMANT_NAME_LENGTH = 100;
const ALLOWED_ACTIONS = ["VIEW", "CLAIM", "REJECT"] as const;

/**
 * Sanitize input string to prevent injection attacks
 * Removes or escapes potentially dangerous characters
 */
function sanitizeInput(input: string, maxLength: number): string {
  if (typeof input !== "string") {
    return "";
  }
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);
  
  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
  
  // Remove potential SQL injection patterns (basic protection, RLS provides main defense)
  sanitized = sanitized.replace(/[';\\]/g, "");
  
  // Remove HTML/script tags to prevent XSS
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  
  return sanitized;
}

/**
 * Validate action is one of the allowed enum values
 */
function isValidAction(action: unknown): action is "VIEW" | "CLAIM" | "REJECT" {
  return typeof action === "string" && ALLOWED_ACTIONS.includes(action as typeof ALLOWED_ACTIONS[number]);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting: 10 requests per minute per IP
  const rateLimitResponse = rateLimitMiddleware(
    req,
    { maxRequests: 10, windowMs: 60000, identifier: "track-node-claim" },
    corsHeaders
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate request structure
    if (typeof body !== "object" || body === null) {
      return new Response(
        JSON.stringify({ error: "Request body must be an object" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { node_id, claimant_name, action } = body as TrackClaimRequest;

    // Validate required fields exist
    if (!node_id || !claimant_name || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: node_id, claimant_name, action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate and sanitize inputs
    const sanitizedNodeId = sanitizeInput(node_id, MAX_NODE_ID_LENGTH);
    const sanitizedClaimantName = sanitizeInput(claimant_name, MAX_CLAIMANT_NAME_LENGTH);

    if (sanitizedNodeId.length === 0) {
      return new Response(
        JSON.stringify({ error: "node_id is required and must be a valid string" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (sanitizedClaimantName.length === 0) {
      return new Response(
        JSON.stringify({ error: "claimant_name is required and must be a valid string" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate action is one of allowed values
    if (!isValidAction(action)) {
      return new Response(
        JSON.stringify({ error: "action must be one of: VIEW, CLAIM, REJECT" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get IP address from headers
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
    const user_agent = req.headers.get("user-agent")?.substring(0, 500) || "unknown";

    if (action === "VIEW") {
      // Check if there's already a view record for this node/claimant combination in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: existingView } = await supabase
        .from("node_claims")
        .select("id")
        .eq("node_id", sanitizedNodeId)
        .eq("claimant_name", sanitizedClaimantName)
        .gte("claimed_at", twentyFourHoursAgo)
        .limit(1)
        .maybeSingle();

      if (existingView) {
        return new Response(
          JSON.stringify({ success: true, message: "View already recorded", id: existingView.id }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Insert new view record
      const { data, error } = await supabase
        .from("node_claims")
        .insert({
          node_id: sanitizedNodeId,
          claimant_name: sanitizedClaimantName,
          ip_address,
          user_agent,
          status: "VIEWED"
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error inserting view:", error);
        return new Response(
          JSON.stringify({ error: "Failed to record view" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "View recorded", id: data.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "CLAIM" || action === "REJECT") {
      // Find the most recent view record for this node/claimant and update it
      const { data: existingRecord } = await supabase
        .from("node_claims")
        .select("id")
        .eq("node_id", sanitizedNodeId)
        .eq("claimant_name", sanitizedClaimantName)
        .order("claimed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const newStatus = action === "CLAIM" ? "CLAIMED" : "REJECTED";

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from("node_claims")
          .update({ 
            status: newStatus,
            ip_address,
            user_agent
          })
          .eq("id", existingRecord.id);

        if (error) {
          console.error("Error updating claim:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update claim status" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: `Status updated to ${newStatus}`, id: existingRecord.id }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // No existing record, create new one with the status
        const { data, error } = await supabase
          .from("node_claims")
          .insert({
            node_id: sanitizedNodeId,
            claimant_name: sanitizedClaimantName,
            ip_address,
            user_agent,
            status: newStatus
          })
          .select("id")
          .single();

        if (error) {
          console.error("Error inserting claim:", error);
          return new Response(
            JSON.stringify({ error: "Failed to record claim" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: `${newStatus} recorded`, id: data.id }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in track-node-claim:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
