import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
    bounce?: {
      message: string;
      type?: string;
    };
    complaint?: {
      feedback_id?: string;
      type?: string;
    };
  };
}

// Verify Resend webhook signature using Svix
async function verifyWebhookSignature(
  payload: string,
  headers: Headers
): Promise<boolean> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature || !RESEND_WEBHOOK_SECRET) {
    console.error("Missing webhook signature headers or secret");
    return false;
  }

  // Check timestamp to prevent replay attacks (5 minute tolerance)
  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error("Webhook timestamp too old or in the future");
    return false;
  }

  // Construct the signed payload
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;

  // Extract the secret (remove 'whsec_' prefix if present)
  let secretBytes: Uint8Array;
  if (RESEND_WEBHOOK_SECRET.startsWith("whsec_")) {
    secretBytes = base64ToUint8Array(RESEND_WEBHOOK_SECRET.slice(6));
  } else {
    secretBytes = new TextEncoder().encode(RESEND_WEBHOOK_SECRET);
  }

  // Compute HMAC-SHA256
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );

  const computedSignature = uint8ArrayToBase64(new Uint8Array(signatureBytes));

  // Parse the signatures from the header (format: "v1,signature1 v1,signature2")
  const signatures = svixSignature.split(" ").map((sig) => {
    const [version, value] = sig.split(",");
    return { version, value };
  });

  // Check if any v1 signature matches
  for (const sig of signatures) {
    if (sig.version === "v1" && sig.value === computedSignature) {
      return true;
    }
  }

  console.error("Webhook signature verification failed");
  return false;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read the raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature - REQUIRED for security
    if (!RESEND_WEBHOOK_SECRET) {
      console.error("RESEND_WEBHOOK_SECRET not configured - webhook signature validation required");
      return new Response(
        JSON.stringify({ error: "Webhook signature validation not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isValid = await verifyWebhookSignature(rawBody, req.headers);
    if (!isValid) {
      console.error("Invalid webhook signature - rejecting request");
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    console.log("Webhook signature verified successfully");

    // Parse the verified payload
    const event: ResendWebhookEvent = JSON.parse(rawBody);
    
    console.log("Resend webhook received:", event.type, event.data?.to);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle bounce events
    if (event.type === "email.bounced") {
      const bouncedEmails = event.data.to || [];
      const bounceReason = event.data.bounce?.message || "Email bounced";
      const bounceType = event.data.bounce?.type || "hard";

      const insertResults: { success: string[]; skipped: string[] } = { success: [], skipped: [] };

      for (const email of bouncedEmails) {
        const { error } = await supabase
          .from("email_bounces")
          .upsert(
            {
              email: email.toLowerCase(),
              bounce_type: bounceType,
              reason: bounceReason,
              bounced_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );

        if (error) {
          console.error(`Error recording bounce for ${email}:`, error);
          insertResults.skipped.push(email);
        } else {
          insertResults.success.push(email);
          console.log(`Recorded bounce for ${email}: ${bounceReason}`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: "bounce",
          processed: insertResults.success.length,
          skipped: insertResults.skipped.length,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Handle complaint/spam events
    if (event.type === "email.complained") {
      const complainedEmails = event.data.to || [];
      const complaintType = event.data.complaint?.type || "spam";
      const feedbackId = event.data.complaint?.feedback_id || null;

      const insertResults: { success: string[]; skipped: string[] } = { success: [], skipped: [] };

      for (const email of complainedEmails) {
        const { error } = await supabase
          .from("email_complaints")
          .upsert(
            {
              email: email.toLowerCase(),
              complaint_type: complaintType,
              feedback_id: feedbackId,
              complained_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );

        if (error) {
          console.error(`Error recording complaint for ${email}:`, error);
          insertResults.skipped.push(email);
        } else {
          insertResults.success.push(email);
          console.log(`Recorded spam complaint for ${email}`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: "complaint",
          processed: insertResults.success.length,
          skipped: insertResults.skipped.length,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Unhandled event type
    return new Response(
      JSON.stringify({ message: "Event type not processed", type: event.type }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error: any) {
    console.error("Error processing Resend webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
