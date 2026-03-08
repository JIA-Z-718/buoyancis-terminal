import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Brand colors
const BRAND = {
  olive: "#5a6f3c",
  oliveLight: "#e8ecd9",
  oliveMuted: "#8fa06f",
  foreground: "#2d2f27",
  muted: "#6b6d64",
  background: "#fcfcfa",
  border: "#e0e2d8",
};

const LOGO_URL = "https://i.imgur.com/nTpVGYt.png";

// HTML escape function to prevent XSS attacks
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const encodedEmail = url.searchParams.get("e");
    const confirmed = url.searchParams.get("confirm") === "true";

    if (!encodedEmail) {
      return new Response(buildHtmlPage("Invalid Link", "This unsubscribe link is invalid or expired."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    let email: string;
    try {
      email = atob(encodedEmail);
    } catch {
      return new Response(buildHtmlPage("Invalid Link", "This unsubscribe link is invalid or expired."), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // If not confirmed, show confirmation page
    if (!confirmed) {
      const confirmUrl = `${SUPABASE_URL}/functions/v1/unsubscribe?e=${encodedEmail}&confirm=true`;
      
      return new Response(buildConfirmationPage(escapeHtml(email), confirmUrl), {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Process unsubscribe
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase
      .from("email_unsubscribes")
      .insert({ email: email.toLowerCase() });

    if (error) {
      if (error.code === "23505") {
        // Already unsubscribed
        return new Response(buildHtmlPage(
          "Already Unsubscribed",
          `<strong>${escapeHtml(email)}</strong> is already unsubscribed from our mailing list.`
        ), {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
      console.error("Unsubscribe error:", error);
      return new Response(buildHtmlPage(
        "Something Went Wrong",
        "We couldn't process your request. Please try again later."
      ), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(buildHtmlPage(
      "Unsubscribed Successfully",
      `<strong>${escapeHtml(email)}</strong> has been removed from our mailing list.<br><br>You will no longer receive emails from Buoyancis.`
    ), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Unsubscribe function error:", error);
    return new Response(buildHtmlPage(
      "Something Went Wrong",
      "We couldn't process your request. Please try again later."
    ), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
};

function buildConfirmationPage(email: string, confirmUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Unsubscribe - Buoyancis</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: ${BRAND.background};
          color: ${BRAND.foreground};
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .container {
          max-width: 440px;
          width: 100%;
          text-align: center;
        }
        .logo { height: 40px; margin-bottom: 32px; }
        h1 { 
          font-family: Georgia, serif;
          font-size: 28px;
          font-weight: 400;
          margin-bottom: 16px;
        }
        .email {
          font-weight: 600;
          color: ${BRAND.olive};
        }
        p { 
          color: ${BRAND.muted};
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn {
          display: inline-block;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-primary {
          background-color: ${BRAND.olive};
          color: white;
        }
        .btn-primary:hover {
          background-color: #4a5f2c;
        }
        .btn-secondary {
          background-color: transparent;
          color: ${BRAND.muted};
          border: 1px solid ${BRAND.border};
        }
        .btn-secondary:hover {
          background-color: ${BRAND.oliveLight};
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="${LOGO_URL}" alt="Buoyancis" class="logo" />
        <h1>Unsubscribe?</h1>
        <p>
          You're about to unsubscribe <span class="email">${email}</span> from our mailing list.
          You will no longer receive updates from Buoyancis.
        </p>
        <div class="buttons">
          <a href="${confirmUrl}" class="btn btn-primary">Confirm Unsubscribe</a>
          <a href="javascript:window.close()" class="btn btn-secondary" onclick="window.close(); return false;">Cancel</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildHtmlPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Buoyancis</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: ${BRAND.background};
          color: ${BRAND.foreground};
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .container {
          max-width: 440px;
          width: 100%;
          text-align: center;
        }
        .logo { height: 40px; margin-bottom: 32px; }
        h1 { 
          font-family: Georgia, serif;
          font-size: 28px;
          font-weight: 400;
          margin-bottom: 16px;
          color: ${BRAND.olive};
        }
        p { 
          color: ${BRAND.muted};
          font-size: 16px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="${LOGO_URL}" alt="Buoyancis" class="logo" />
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
