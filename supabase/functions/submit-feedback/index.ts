import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware, getClientIp } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type SubmitFeedbackRequest = {
  feedbackType: string;
  message: string;
  email?: string;
  turnstileToken: string;
  source?: string;
};

function isValidEmail(email: string): boolean {
  // basic, intentionally strict enough for UI inputs
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    // Fail closed: we explicitly want CAPTCHA protection for this endpoint.
    throw new Error("TURNSTILE_SECRET_KEY not configured");
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
  });

  const data = await res.json();
  return data?.success === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limiting: 5 requests per hour per IP
  const rateLimitResponse = rateLimitMiddleware(
    req,
    { maxRequests: 5, windowMs: 60 * 60 * 1000, identifier: "submit-feedback" },
    corsHeaders
  );
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip = getClientIp(req);

  let body: SubmitFeedbackRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const feedbackType = (body.feedbackType || "").trim();
  const message = (body.message || "").trim();
  const email = (body.email || "").trim();
  const turnstileToken = (body.turnstileToken || "").trim();

  if (!feedbackType || feedbackType.length > 50) {
    return new Response(JSON.stringify({ error: "Invalid feedback type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!message || message.length < 10 || message.length > 1000) {
    return new Response(
      JSON.stringify({ error: "Message must be between 10 and 1000 characters" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!turnstileToken || turnstileToken.length > 4096) {
    return new Response(JSON.stringify({ error: "Verification required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (email && (email.length > 255 || !isValidEmail(email))) {
    return new Response(JSON.stringify({ error: "Invalid email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const ok = await verifyTurnstileToken(turnstileToken, ip);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Security verification failed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("[submit-feedback] Turnstile verification error:", err);
    return new Response(JSON.stringify({ error: "Security verification unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error: insertError } = await supabase.from("user_feedback").insert({
    feedback_type: feedbackType,
    message,
    email: email || null,
  });

  if (insertError) {
    console.error("[submit-feedback] DB insert error:", insertError);
    return new Response(JSON.stringify({ error: "Failed to submit feedback" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Notify admins (best-effort). Keep this server-side so the client can't directly spam notify-feedback.
  try {
    await fetch(`${supabaseUrl}/functions/v1/notify-feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Calls the function with a privileged token so it can also read settings tables safely.
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        feedbackType,
        message,
        email: email || undefined,
        source: body.source,
      }),
    });
  } catch (err) {
    console.warn("[submit-feedback] notify-feedback failed (ignored):", err);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
