import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { render } from "https://deno.land/x/resvg_wasm@0.2.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Letter to concept mapping
const letterMappings: Record<string, string> = {
  A: "Asset", B: "Birth", C: "Care", D: "Depth", E: "Energy",
  F: "Flow", G: "Growth", H: "Harmony", I: "Integration", J: "Journey",
  K: "Knowledge", L: "Light", M: "Motion", N: "Network", O: "Order",
  P: "Power", Q: "Quest", R: "Rhythm", S: "Service", T: "Trust",
  U: "Unity", V: "Vision", W: "Wisdom", X: "Exchange", Y: "Yield", Z: "Zenith",
};

// Concept colors for visual variety (HSL values for better gradients)
const conceptColors: Record<string, { hex: string; hue: number }> = {
  Asset: { hex: "#D4AF37", hue: 43 },
  Birth: { hex: "#FFB6C1", hue: 350 },
  Care: { hex: "#90EE90", hue: 120 },
  Depth: { hex: "#4682B4", hue: 207 },
  Energy: { hex: "#FFA500", hue: 39 },
  Flow: { hex: "#87CEEB", hue: 197 },
  Growth: { hex: "#228B22", hue: 120 },
  Harmony: { hex: "#DAA520", hue: 43 },
  Integration: { hex: "#9370DB", hue: 260 },
  Journey: { hex: "#FF8C00", hue: 33 },
  Knowledge: { hex: "#FFD700", hue: 51 },
  Light: { hex: "#FFFACD", hue: 54 },
  Motion: { hex: "#6495ED", hue: 219 },
  Network: { hex: "#00BFFF", hue: 195 },
  Order: { hex: "#C0C0C0", hue: 0 },
  Power: { hex: "#DC143C", hue: 348 },
  Quest: { hex: "#BA55D3", hue: 288 },
  Rhythm: { hex: "#FF6347", hue: 9 },
  Service: { hex: "#3CB371", hue: 147 },
  Trust: { hex: "#4169E1", hue: 225 },
  Unity: { hex: "#E8E8E8", hue: 0 },
  Vision: { hex: "#8A2BE2", hue: 271 },
  Wisdom: { hex: "#DAA520", hue: 43 },
  Exchange: { hex: "#00CED1", hue: 181 },
  Yield: { hex: "#9ACD32", hue: 80 },
  Zenith: { hex: "#FFFACD", hue: 54 },
};

function decodeWord(word: string): { letter: string; concept: string; color: string; hue: number }[] {
  return word
    .toUpperCase()
    .split("")
    .filter((char) => /[A-Z]/.test(char))
    .map((char) => {
      const concept = letterMappings[char] || char;
      const colorData = conceptColors[concept] || { hex: "#888888", hue: 0 };
      return {
        letter: char,
        concept,
        color: colorData.hex,
        hue: colorData.hue,
      };
    });
}

function getTotemString(decoded: { concept: string }[]): string {
  return decoded.map((d) => d.concept.charAt(0)).join("·");
}

// Generate simplified SVG for PNG conversion (without filters that resvg doesn't support well)
function generateSimpleSVG(word: string): string {
  const decoded = decodeWord(word);
  const totemString = getTotemString(decoded);
  const width = 1200;
  const height = 630;
  const centerX = width / 2;
  const centerY = height / 2 - 30;
  const baseRadius = 160;

  // Generate orbital elements without complex filters
  let orbitals = "";
  decoded.forEach((item, index) => {
    const angle = (index / decoded.length) * Math.PI * 2 - Math.PI / 2;
    const orbitRadius = baseRadius + (index % 2) * 20;
    const x = centerX + Math.cos(angle) * orbitRadius;
    const y = centerY + Math.sin(angle) * orbitRadius;

    // Orbital arc segment
    const arcStart = angle - 0.4;
    const arcEnd = angle + 0.4;
    const arcRadius = baseRadius * 1.3;
    const startX = centerX + Math.cos(arcStart) * arcRadius;
    const startY = centerY + Math.sin(arcStart) * arcRadius;
    const endX = centerX + Math.cos(arcEnd) * arcRadius;
    const endY = centerY + Math.sin(arcEnd) * arcRadius;

    orbitals += `
      <path d="M${startX},${startY} A${arcRadius},${arcRadius} 0 0,1 ${endX},${endY}" 
            fill="none" stroke="${item.color}" stroke-width="2" opacity="0.4" stroke-linecap="round"/>
      <line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" 
            stroke="${item.color}" stroke-width="1" opacity="0.15"/>
      <circle cx="${x}" cy="${y}" r="40" fill="${item.color}" opacity="0.08"/>
      <circle cx="${x}" cy="${y}" r="32" fill="none" stroke="${item.color}" stroke-width="2" opacity="0.7"/>
      <circle cx="${x}" cy="${y}" r="26" fill="#0a0a0a" stroke="${item.color}" stroke-width="1" opacity="0.5"/>
      <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" 
            fill="${item.color}" font-family="monospace" 
            font-size="22" font-weight="600">${item.letter}</text>
      <text x="${x}" y="${y + 50}" text-anchor="middle" 
            fill="${item.color}" font-family="monospace" 
            font-size="10" opacity="0.6">${item.concept.toUpperCase()}</text>`;
  });

  // Concept flow
  const conceptY = height - 80;
  const maxConceptWidth = Math.min(100, (width - 200) / decoded.length);
  const totalWidth = (decoded.length - 1) * maxConceptWidth;
  const startX = (width - totalWidth) / 2;
  let conceptFlow = "";
  decoded.forEach((item, index) => {
    const x = startX + index * maxConceptWidth;
    conceptFlow += `<text x="${x}" y="${conceptY}" text-anchor="middle" 
          fill="${item.color}" font-family="monospace" font-size="16" font-weight="500">${item.concept.charAt(0)}</text>`;
    if (index < decoded.length - 1) {
      conceptFlow += `<text x="${x + maxConceptWidth / 2}" y="${conceptY}" text-anchor="middle" 
            fill="#3a3a3a" font-family="monospace" font-size="14">→</text>`;
    }
  });

  // Corner brackets
  const cornerSize = 40;
  const cornerOffset = 30;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="#0a0a0a"/>
  
  <!-- Corner brackets -->
  <path d="M${cornerOffset},${cornerOffset + cornerSize} L${cornerOffset},${cornerOffset} L${cornerOffset + cornerSize},${cornerOffset}" 
        fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M${width - cornerOffset - cornerSize},${cornerOffset} L${width - cornerOffset},${cornerOffset} L${width - cornerOffset},${cornerOffset + cornerSize}" 
        fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M${cornerOffset},${height - cornerOffset - cornerSize} L${cornerOffset},${height - cornerOffset} L${cornerOffset + cornerSize},${height - cornerOffset}" 
        fill="none" stroke="#2a2a2a" stroke-width="2"/>
  <path d="M${width - cornerOffset - cornerSize},${height - cornerOffset} L${width - cornerOffset},${height - cornerOffset} L${width - cornerOffset},${height - cornerOffset - cornerSize}" 
        fill="none" stroke="#2a2a2a" stroke-width="2"/>
  
  <!-- Central orbital rings -->
  <circle cx="${centerX}" cy="${centerY}" r="${baseRadius * 1.5}" fill="none" stroke="#1a1a1a" stroke-width="1"/>
  <circle cx="${centerX}" cy="${centerY}" r="${baseRadius * 1.2}" fill="none" stroke="#222" stroke-width="1" stroke-dasharray="3,8"/>
  <circle cx="${centerX}" cy="${centerY}" r="${baseRadius * 0.9}" fill="none" stroke="#1a1a1a" stroke-width="1"/>
  
  <!-- Orbital elements -->
  ${orbitals}
  
  <!-- Center word -->
  <text x="${centerX}" y="${centerY - 8}" text-anchor="middle" 
        fill="#ffffff" font-family="monospace" 
        font-size="52" font-weight="700" letter-spacing="0.12em">${word.toUpperCase()}</text>
  
  <!-- Totem string -->
  <text x="${centerX}" y="${centerY + 35}" text-anchor="middle" 
        fill="#5a6f3c" font-family="monospace" 
        font-size="18" letter-spacing="0.25em">${totemString}</text>
  
  <!-- Concept flow -->
  ${conceptFlow}
  
  <!-- Branding -->
  <text x="${centerX}" y="${height - 40}" text-anchor="middle" 
        fill="#3a3a3a" font-family="monospace" font-size="11" letter-spacing="0.2em">BUOYANCIS · STRUCTURE IN MOTION</text>
  
  <!-- Top/bottom decorative lines -->
  <rect x="100" y="45" width="${width - 200}" height="1" fill="#1a1a1a"/>
  <rect x="100" y="${height - 25}" width="${width - 200}" height="1" fill="#1a1a1a"/>
</svg>`;
}

// Generate premium SVG for the OG image with enhanced aesthetics
function generateSVG(word: string): string {
  const decoded = decodeWord(word);
  const totemString = getTotemString(decoded);
  const width = 1200;
  const height = 630;
  const centerX = width / 2;
  const centerY = height / 2 - 30;
  const baseRadius = 160;

  // Generate unique gradient ID based on word
  const gradientId = `grad_${word.toLowerCase()}`;

  // Create dynamic gradient stops based on concepts
  const gradientStops = decoded
    .map((item, i) => {
      const offset = Math.round((i / (decoded.length - 1 || 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${item.color}" stop-opacity="0.3"/>`;
    })
    .join("");

  // Generate orbital elements with glow effects
  let orbitals = "";
  let glowDefs = "";

  decoded.forEach((item, index) => {
    const angle = (index / decoded.length) * Math.PI * 2 - Math.PI / 2;
    const orbitRadius = baseRadius + (index % 2) * 20;
    const x = centerX + Math.cos(angle) * orbitRadius;
    const y = centerY + Math.sin(angle) * orbitRadius;
    const glowId = `glow_${index}`;

    // Add glow filter for each concept
    glowDefs += `
      <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>`;

    // Orbital arc segment
    const arcStart = angle - 0.4;
    const arcEnd = angle + 0.4;
    const arcRadius = baseRadius * 1.3;
    const startX = centerX + Math.cos(arcStart) * arcRadius;
    const startY = centerY + Math.sin(arcStart) * arcRadius;
    const endX = centerX + Math.cos(arcEnd) * arcRadius;
    const endY = centerY + Math.sin(arcEnd) * arcRadius;

    orbitals += `
      <path d="M${startX},${startY} A${arcRadius},${arcRadius} 0 0,1 ${endX},${endY}" 
            fill="none" stroke="${item.color}" stroke-width="2" opacity="0.4" stroke-linecap="round"/>`;

    // Connection line to center
    orbitals += `
      <line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" 
            stroke="${item.color}" stroke-width="1" opacity="0.15"/>`;

    // Outer glow circle
    orbitals += `
      <circle cx="${x}" cy="${y}" r="40" fill="${item.color}" opacity="0.08"/>`;

    // Main concept circle with gradient
    orbitals += `
      <circle cx="${x}" cy="${y}" r="32" fill="none" stroke="${item.color}" stroke-width="2" opacity="0.7"/>
      <circle cx="${x}" cy="${y}" r="26" fill="#0a0a0a" stroke="${item.color}" stroke-width="1" opacity="0.5"/>`;

    // Letter with glow
    orbitals += `
      <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" 
            fill="${item.color}" font-family="'SF Mono', 'Monaco', 'Consolas', monospace" 
            font-size="22" font-weight="600" filter="url(#${glowId})">${item.letter}</text>`;

    // Small concept label
    const labelY = y + 50;
    orbitals += `
      <text x="${x}" y="${labelY}" text-anchor="middle" 
            fill="${item.color}" font-family="'SF Mono', monospace" 
            font-size="10" opacity="0.6" letter-spacing="0.05em">${item.concept.toUpperCase()}</text>`;
  });

  // Generate concept flow with arrows
  const conceptY = height - 80;
  const maxConceptWidth = Math.min(100, (width - 200) / decoded.length);
  const totalWidth = (decoded.length - 1) * maxConceptWidth;
  const startX = (width - totalWidth) / 2;

  let conceptFlow = "";
  decoded.forEach((item, index) => {
    const x = startX + index * maxConceptWidth;

    // Concept initial letter
    conceptFlow += `
      <text x="${x}" y="${conceptY}" text-anchor="middle" 
            fill="${item.color}" font-family="'SF Mono', monospace" 
            font-size="16" font-weight="500">${item.concept.charAt(0)}</text>`;

    // Arrow between concepts
    if (index < decoded.length - 1) {
      const arrowX = x + maxConceptWidth / 2;
      conceptFlow += `
        <text x="${arrowX}" y="${conceptY}" text-anchor="middle" 
              fill="#3a3a3a" font-family="monospace" font-size="14">→</text>`;
    }
  });

  // Corner L-brackets
  const cornerSize = 40;
  const cornerOffset = 30;
  const corners = `
    <path d="M${cornerOffset},${cornerOffset + cornerSize} L${cornerOffset},${cornerOffset} L${cornerOffset + cornerSize},${cornerOffset}" 
          fill="none" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"/>
    <path d="M${width - cornerOffset - cornerSize},${cornerOffset} L${width - cornerOffset},${cornerOffset} L${width - cornerOffset},${cornerOffset + cornerSize}" 
          fill="none" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"/>
    <path d="M${cornerOffset},${height - cornerOffset - cornerSize} L${cornerOffset},${height - cornerOffset} L${cornerOffset + cornerSize},${height - cornerOffset}" 
          fill="none" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"/>
    <path d="M${width - cornerOffset - cornerSize},${height - cornerOffset} L${width - cornerOffset},${height - cornerOffset} L${width - cornerOffset},${height - cornerOffset - cornerSize}" 
          fill="none" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"/>`;

  // Subtle noise texture pattern
  const noisePattern = `
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" opacity="0.03"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradients -->
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#111111"/>
      <stop offset="40%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="35%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
      ${gradientStops}
    </linearGradient>
    
    <!-- Glow filters -->
    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    ${glowDefs}
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGlow)"/>
  <rect width="100%" height="100%" fill="url(#centerGlow)"/>
  ${noisePattern}
  
  <!-- Corner brackets -->
  ${corners}
  
  <!-- Central orbital rings -->
  <circle cx="${centerX}" cy="${centerY}" r="${baseRadius * 1.5}" fill="none" stroke="#1a1a1a" stroke-width="1"/>
  <circle cx="${centerX}" cy="${centerY}" r="${baseRadius * 1.2}" fill="none" stroke="#222" stroke-width="1" stroke-dasharray="3,8"/>
  <circle cx="${centerX}" cy="${centerY}" r="${baseRadius * 0.9}" fill="none" stroke="#1a1a1a" stroke-width="1"/>
  
  <!-- Orbital elements -->
  ${orbitals}
  
  <!-- Center word -->
  <text x="${centerX}" y="${centerY - 8}" text-anchor="middle" 
        fill="#ffffff" font-family="'SF Mono', 'Monaco', 'Consolas', monospace" 
        font-size="52" font-weight="700" letter-spacing="0.12em" 
        filter="url(#textGlow)">${word.toUpperCase()}</text>
  
  <!-- Totem string -->
  <text x="${centerX}" y="${centerY + 35}" text-anchor="middle" 
        fill="#5a6f3c" font-family="'SF Mono', monospace" 
        font-size="18" letter-spacing="0.25em" opacity="0.9">${totemString}</text>
  
  <!-- Horizontal accent lines -->
  <rect x="${(width - 400) / 2}" y="${centerY + 55}" width="400" height="1" fill="url(#${gradientId})"/>
  
  <!-- Concept flow -->
  ${conceptFlow}
  
  <!-- Branding -->
  <text x="${centerX}" y="${height - 40}" text-anchor="middle" 
        fill="#3a3a3a" font-family="'SF Mono', monospace" 
        font-size="11" letter-spacing="0.2em">BUOYANCIS · STRUCTURE IN MOTION</text>
  
  <!-- Top/bottom decorative lines -->
  <rect x="100" y="45" width="${width - 200}" height="1" fill="#1a1a1a"/>
  <rect x="100" y="${height - 25}" width="${width - 200}" height="1" fill="#1a1a1a"/>
</svg>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const word = url.searchParams.get("word") || "DECODE";
    const format = url.searchParams.get("format") || "svg";

    // Sanitize word - only allow letters, max 12 characters
    const sanitizedWord = word.replace(/[^a-zA-Z]/g, "").slice(0, 12);

    if (!sanitizedWord) {
      return new Response(
        JSON.stringify({ error: "Invalid word parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const svg = generateSVG(sanitizedWord);

    if (format === "json") {
      const decoded = decodeWord(sanitizedWord);
      return new Response(
        JSON.stringify({
          word: sanitizedWord.toUpperCase(),
          svg: svg,
          decoded: decoded.map((d) => ({ letter: d.letter, concept: d.concept })),
          totem: getTotemString(decoded),
          width: 1200,
          height: 630,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle PNG format - convert simplified SVG to PNG using resvg-wasm
    if (format === "png") {
      try {
        // Use simplified SVG without complex filters for better PNG conversion
        const simpleSvg = generateSimpleSVG(sanitizedWord);
        const pngData = await render(simpleSvg);
        // Convert Uint8Array to a new ArrayBuffer for Response
        const responseBuffer = new Uint8Array(pngData).buffer;
        return new Response(responseBuffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        });
      } catch (pngError) {
        console.error("PNG conversion error:", pngError);
        // Fallback to SVG if PNG conversion fails
        return new Response(svg, {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        });
      }
    }

    // Return SVG image with proper caching (default)
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
