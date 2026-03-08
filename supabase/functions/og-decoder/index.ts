import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Letter to concept mapping (same as frontend)
const letterMappings: Record<string, { en: string; zh: string }> = {
  A: { en: "Asset", zh: "資產" },
  B: { en: "Birth", zh: "誕生" },
  C: { en: "Care", zh: "關懷" },
  D: { en: "Depth", zh: "深度" },
  E: { en: "Energy", zh: "能量" },
  F: { en: "Flow", zh: "流動" },
  G: { en: "Growth", zh: "成長" },
  H: { en: "Harmony", zh: "和諧" },
  I: { en: "Integration", zh: "整合" },
  J: { en: "Journey", zh: "旅程" },
  K: { en: "Knowledge", zh: "知識" },
  L: { en: "Light", zh: "光明" },
  M: { en: "Motion", zh: "運動" },
  N: { en: "Network", zh: "網絡" },
  O: { en: "Order", zh: "秩序" },
  P: { en: "Power", zh: "力量" },
  Q: { en: "Quest", zh: "探索" },
  R: { en: "Rhythm", zh: "節奏" },
  S: { en: "Service", zh: "服務" },
  T: { en: "Trust", zh: "信任" },
  U: { en: "Unity", zh: "統一" },
  V: { en: "Vision", zh: "願景" },
  W: { en: "Wisdom", zh: "智慧" },
  X: { en: "Exchange", zh: "交換" },
  Y: { en: "Yield", zh: "收穫" },
  Z: { en: "Zenith", zh: "頂點" },
};

function decodeWord(word: string): string {
  return word
    .toUpperCase()
    .split("")
    .filter((char) => /[A-Z]/.test(char))
    .map((char) => letterMappings[char]?.en || char)
    .join(" → ");
}

function getTotemString(word: string): string {
  return word
    .toUpperCase()
    .split("")
    .filter((char) => /[A-Z]/.test(char))
    .map((char) => {
      const concept = letterMappings[char]?.en || char;
      return concept.charAt(0).toUpperCase();
    })
    .join("·");
}

function getLetterBreakdown(word: string): string {
  return word
    .toUpperCase()
    .split("")
    .filter((char) => /[A-Z]/.test(char))
    .map((char) => `${char}(${letterMappings[char]?.en || char})`)
    .join("-");
}

// Check if request is from a social media crawler/bot
function isSocialCrawler(userAgent: string): boolean {
  const crawlerPatterns = [
    /facebookexternalhit/i,
    /Facebot/i,
    /Twitterbot/i,
    /LinkedInBot/i,
    /WhatsApp/i,
    /Slackbot/i,
    /TelegramBot/i,
    /Discordbot/i,
    /Pinterest/i,
    /Googlebot/i,
    /bingbot/i,
    /Baiduspider/i,
    /Line/i,
  ];
  return crawlerPatterns.some((pattern) => pattern.test(userAgent));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const word = url.searchParams.get("word") || "";
    const format = url.searchParams.get("format") || "auto"; // "html", "json", or "auto"
    const userAgent = req.headers.get("user-agent") || "";
    const baseUrl = Deno.env.get("SITE_URL") || "https://buoyancis.com";

    // Default decoder page metadata
    const defaultTitle = "The Decoder — Buoyancis";
    const defaultDescription = "Transform any word into its structural DNA — Discover the hidden concepts within language.";

    // Generate word-specific metadata if word is provided
    const decodedString = word ? decodeWord(word) : "";
    const totemString = word ? getTotemString(word) : "";
    const letterBreakdown = word ? getLetterBreakdown(word) : "";
    
    const title = word ? `${word.toUpperCase()} — Buoyancis Decoder` : defaultTitle;
    const description = word
      ? `${word.toUpperCase()} → ${letterBreakdown} | Decode the structural DNA of any word.`
      : defaultDescription;
    
    // Use dynamic OG image for words (PNG format for maximum platform compatibility)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://hilhvunhhhexhuneefmy.supabase.co";
    const ogImage = word 
      ? `${supabaseUrl}/functions/v1/og-image-decoder?word=${encodeURIComponent(word)}&format=png`
      : `${baseUrl}/og-image.png`;
    const ogUrl = word
      ? `${baseUrl}/decoder?word=${encodeURIComponent(word)}`
      : `${baseUrl}/decoder`;
    const canonicalUrl = ogUrl;

    // Determine response format
    const wantsHtml = format === "html" || (format === "auto" && isSocialCrawler(userAgent));
    const wantsJson = format === "json";

    if (wantsJson) {
      // Return OG metadata as JSON (for API usage)
      const metadata = {
        title,
        description,
        image: ogImage,
        url: ogUrl,
        word: word ? word.toUpperCase() : null,
        decoded: decodedString || null,
        totem: totemString || null,
        letterBreakdown: letterBreakdown || null,
      };

      return new Response(JSON.stringify(metadata), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600"
        },
      });
    }

    if (wantsHtml) {
      // Return full HTML page with proper OG tags for social crawlers
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${ogUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Buoyancis">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <meta name="twitter:site" content="@Buoyancis">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Redirect non-crawlers to the actual SPA -->
  <script>
    // Only redirect if not a known crawler (they don't run JS anyway)
    if (typeof window !== 'undefined') {
      window.location.replace("${ogUrl}");
    }
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${ogUrl}">
  </noscript>
  
  <style>
    body {
      background: #000;
      color: #fff;
      font-family: 'Courier New', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    h1 {
      font-size: 2.5rem;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }
    .decoded {
      font-size: 1rem;
      color: #666;
      max-width: 600px;
      line-height: 1.6;
    }
    .totem {
      font-size: 1.5rem;
      color: #888;
      letter-spacing: 0.2em;
      margin: 1rem 0;
    }
    a {
      color: #888;
      text-decoration: none;
      margin-top: 2rem;
      display: inline-block;
    }
    a:hover {
      color: #fff;
    }
  </style>
</head>
<body>
  <h1>${word ? escapeHtml(word.toUpperCase()) : "THE DECODER"}</h1>
  ${word ? `<p class="totem">${escapeHtml(totemString)}</p>` : ""}
  <p class="decoded">${word ? escapeHtml(decodedString) : "Transform any word into its structural DNA"}</p>
  <a href="${ogUrl}">→ Open Decoder</a>
</body>
</html>`;

      return new Response(html, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Default: redirect to the actual SPA page
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": ogUrl,
      },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Helper to escape HTML special characters
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
