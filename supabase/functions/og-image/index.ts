import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Letter to concept mapping
const letterMappings: Record<string, { concept: string; symbol: string }> = {
  A: { concept: "Asset", symbol: "△" },
  B: { concept: "Birth", symbol: "◉" },
  C: { concept: "Care", symbol: "♡" },
  D: { concept: "Depth", symbol: "▽" },
  E: { concept: "Energy", symbol: "⚡" },
  F: { concept: "Flow", symbol: "≋" },
  G: { concept: "Growth", symbol: "↑" },
  H: { concept: "Harmony", symbol: "∞" },
  I: { concept: "Integration", symbol: "⊕" },
  J: { concept: "Journey", symbol: "→" },
  K: { concept: "Knowledge", symbol: "◈" },
  L: { concept: "Light", symbol: "☀" },
  M: { concept: "Motion", symbol: "⟳" },
  N: { concept: "Network", symbol: "◇" },
  O: { concept: "Order", symbol: "○" },
  P: { concept: "Power", symbol: "⬡" },
  Q: { concept: "Quest", symbol: "?" },
  R: { concept: "Rhythm", symbol: "∿" },
  S: { concept: "Service", symbol: "★" },
  T: { concept: "Trust", symbol: "⬢" },
  U: { concept: "Unity", symbol: "∪" },
  V: { concept: "Vision", symbol: "◐" },
  W: { concept: "Wisdom", symbol: "Ω" },
  X: { concept: "Exchange", symbol: "⨉" },
  Y: { concept: "Yield", symbol: "⌘" },
  Z: { concept: "Zenith", symbol: "▲" },
};

function decodeWord(word: string): Array<{ letter: string; concept: string; symbol: string }> {
  return word
    .toUpperCase()
    .split("")
    .filter((char) => /[A-Z]/.test(char))
    .map((char) => ({
      letter: char,
      concept: letterMappings[char]?.concept || char,
      symbol: letterMappings[char]?.symbol || char,
    }));
}

function generateSVG(word: string, decoded: Array<{ letter: string; concept: string; symbol: string }>): string {
  const width = 1200;
  const height = 630;
  
  // Calculate card positions
  const cardWidth = 60;
  const cardHeight = 80;
  const cardGap = 12;
  const totalCardsWidth = decoded.length * cardWidth + (decoded.length - 1) * cardGap;
  const startX = (width - totalCardsWidth) / 2;
  const cardsY = height / 2 - 20;

  // Generate card elements
  const cards = decoded.map((item, index) => {
    const x = startX + index * (cardWidth + cardGap);
    return `
      <g transform="translate(${x}, ${cardsY})">
        <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="8" 
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <text x="${cardWidth/2}" y="28" text-anchor="middle" 
              fill="rgba(255,255,255,0.4)" font-family="monospace" font-size="20">${item.symbol}</text>
        <text x="${cardWidth/2}" y="52" text-anchor="middle" 
              fill="white" font-family="monospace" font-size="18" font-weight="bold">${item.letter}</text>
        <text x="${cardWidth/2}" y="70" text-anchor="middle" 
              fill="rgba(255,255,255,0.5)" font-family="monospace" font-size="8" 
              letter-spacing="0.5">${item.concept.substring(0, 6).toUpperCase()}</text>
      </g>
    `;
  }).join("");

  // Generate concept flow text
  const conceptFlow = decoded.map(d => d.concept.charAt(0)).join(" · ");

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0a"/>
          <stop offset="50%" style="stop-color:#111111"/>
          <stop offset="100%" style="stop-color:#0a0a0a"/>
        </linearGradient>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0)"/>
          <stop offset="50%" style="stop-color:rgba(255,255,255,0.1)"/>
          <stop offset="100%" style="stop-color:rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      
      <!-- Subtle grid pattern -->
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
      </pattern>
      <rect width="${width}" height="${height}" fill="url(#grid)"/>
      
      <!-- Horizontal glow line -->
      <rect x="0" y="${cardsY + cardHeight + 30}" width="${width}" height="1" fill="url(#glow)"/>
      
      <!-- Header -->
      <text x="${width/2}" y="80" text-anchor="middle" 
            fill="rgba(255,255,255,0.3)" font-family="monospace" font-size="12" 
            letter-spacing="8">THE DECODER</text>
      
      <!-- Main word -->
      <text x="${width/2}" y="140" text-anchor="middle" 
            fill="white" font-family="monospace" font-size="48" font-weight="bold" 
            letter-spacing="12">${word.toUpperCase()}</text>
      
      <!-- Totem cards -->
      ${cards}
      
      <!-- Concept flow -->
      <text x="${width/2}" y="${cardsY + cardHeight + 60}" text-anchor="middle" 
            fill="rgba(255,255,255,0.4)" font-family="monospace" font-size="16" 
            letter-spacing="4">${conceptFlow}</text>
      
      <!-- Footer branding -->
      <text x="${width/2}" y="${height - 40}" text-anchor="middle" 
            fill="rgba(255,255,255,0.2)" font-family="monospace" font-size="11" 
            letter-spacing="6">BUOYANCIS.COM</text>
    </svg>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const word = url.searchParams.get("word") || "BUOYANCIS";
    const format = url.searchParams.get("format") || "svg";

    const decoded = decodeWord(word);
    
    if (decoded.length === 0) {
      return new Response("Invalid word", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const svg = generateSVG(word, decoded);

    if (format === "svg") {
      return new Response(svg, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // For PNG, we return the SVG with instructions
    // Note: Full PNG conversion would require additional libraries
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response(JSON.stringify({ error: "Failed to generate image" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
