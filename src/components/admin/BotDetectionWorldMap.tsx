import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { getCountryFlag } from "@/hooks/useIpGeolocation";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// Simplified world map paths - major countries only for performance
// These are simplified SVG paths for each country (mercator-style projection)
const COUNTRY_PATHS: Record<string, { path: string; center: [number, number] }> = {
  US: { path: "M-125,50 L-125,30 L-70,30 L-70,50 Z", center: [-97, 40] },
  CA: { path: "M-140,75 L-140,50 L-55,50 L-55,75 Z", center: [-95, 60] },
  MX: { path: "M-120,30 L-120,15 L-85,15 L-85,30 Z", center: [-102, 23] },
  BR: { path: "M-75,5 L-75,-35 L-35,-35 L-35,5 Z", center: [-55, -15] },
  AR: { path: "M-75,-25 L-75,-55 L-55,-55 L-55,-25 Z", center: [-65, -40] },
  GB: { path: "M-10,60 L-10,50 L5,50 L5,60 Z", center: [-2, 55] },
  FR: { path: "M-5,52 L-5,42 L10,42 L10,52 Z", center: [2, 47] },
  DE: { path: "M5,55 L5,47 L15,47 L15,55 Z", center: [10, 51] },
  ES: { path: "M-10,44 L-10,36 L5,36 L5,44 Z", center: [-3, 40] },
  IT: { path: "M8,47 L8,36 L20,36 L20,47 Z", center: [12, 42] },
  NL: { path: "M3,54 L3,50 L8,50 L8,54 Z", center: [5, 52] },
  BE: { path: "M2,52 L2,49 L7,49 L7,52 Z", center: [4, 50] },
  CH: { path: "M5,48 L5,45 L12,45 L12,48 Z", center: [8, 47] },
  AT: { path: "M10,49 L10,46 L18,46 L18,49 Z", center: [14, 47] },
  PL: { path: "M14,55 L14,49 L25,49 L25,55 Z", center: [19, 52] },
  SE: { path: "M10,70 L10,55 L25,55 L25,70 Z", center: [17, 62] },
  NO: { path: "M5,75 L5,58 L15,58 L15,75 Z", center: [10, 65] },
  FI: { path: "M22,70 L22,60 L32,60 L32,70 Z", center: [26, 64] },
  DK: { path: "M8,58 L8,54 L13,54 L13,58 Z", center: [10, 56] },
  RU: { path: "M30,75 L30,45 L180,45 L180,75 Z", center: [100, 60] },
  UA: { path: "M28,52 L28,45 L42,45 L42,52 Z", center: [32, 49] },
  CN: { path: "M75,55 L75,20 L135,20 L135,55 Z", center: [105, 35] },
  JP: { path: "M130,45 L130,30 L145,30 L145,45 Z", center: [138, 36] },
  KR: { path: "M125,40 L125,33 L130,33 L130,40 Z", center: [127, 36] },
  IN: { path: "M65,35 L65,5 L95,5 L95,35 Z", center: [78, 22] },
  PK: { path: "M60,38 L60,22 L78,22 L78,38 Z", center: [70, 30] },
  BD: { path: "M85,28 L85,20 L95,20 L95,28 Z", center: [90, 24] },
  VN: { path: "M100,25 L100,8 L112,8 L112,25 Z", center: [106, 16] },
  TH: { path: "M95,22 L95,5 L108,5 L108,22 Z", center: [101, 14] },
  ID: { path: "M95,10 L95,-12 L140,-12 L140,10 Z", center: [117, -2] },
  MY: { path: "M95,10 L95,0 L120,0 L120,10 Z", center: [110, 4] },
  SG: { path: "M102,3 L102,0 L106,0 L106,3 Z", center: [104, 1] },
  PH: { path: "M118,22 L118,5 L128,5 L128,22 Z", center: [122, 12] },
  AU: { path: "M110,-10 L110,-45 L155,-45 L155,-10 Z", center: [134, -25] },
  NZ: { path: "M165,-32 L165,-48 L180,-48 L180,-32 Z", center: [172, -42] },
  ZA: { path: "M15,-20 L15,-35 L35,-35 L35,-20 Z", center: [25, -30] },
  NG: { path: "M2,15 L2,2 L18,2 L18,15 Z", center: [8, 10] },
  EG: { path: "M25,32 L25,22 L38,22 L38,32 Z", center: [30, 27] },
  KE: { path: "M35,5 L35,-5 L45,-5 L45,5 Z", center: [38, 0] },
  MA: { path: "M-15,38 L-15,28 L0,28 L0,38 Z", center: [-8, 32] },
  AE: { path: "M50,28 L50,22 L58,22 L58,28 Z", center: [54, 24] },
  SA: { path: "M35,32 L35,15 L55,15 L55,32 Z", center: [45, 24] },
  IL: { path: "M33,34 L33,29 L37,29 L37,34 Z", center: [35, 31] },
  TR: { path: "M25,42 L25,35 L45,35 L45,42 Z", center: [35, 39] },
  IR: { path: "M45,40 L45,25 L65,25 L65,40 Z", center: [53, 32] },
  IQ: { path: "M40,38 L40,28 L50,28 L50,38 Z", center: [44, 33] },
  PT: { path: "M-12,42 L-12,36 L-5,36 L-5,42 Z", center: [-8, 39] },
  IE: { path: "M-12,55 L-12,51 L-5,51 L-5,55 Z", center: [-8, 53] },
  GR: { path: "M18,42 L18,35 L30,35 L30,42 Z", center: [22, 39] },
  CZ: { path: "M12,51 L12,48 L20,48 L20,51 Z", center: [15, 50] },
  RO: { path: "M22,48 L22,43 L32,43 L32,48 Z", center: [25, 46] },
  HU: { path: "M16,49 L16,45 L23,45 L23,49 Z", center: [19, 47] },
  CL: { path: "M-78,-20 L-78,-55 L-68,-55 L-68,-20 Z", center: [-71, -35] },
  CO: { path: "M-80,15 L-80,-5 L-65,-5 L-65,15 Z", center: [-72, 4] },
  PE: { path: "M-82,0 L-82,-20 L-68,-20 L-68,0 Z", center: [-76, -10] },
  VE: { path: "M-75,15 L-75,0 L-58,0 L-58,15 Z", center: [-66, 8] },
};

// Map of country names
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil", AR: "Argentina",
  GB: "United Kingdom", FR: "France", DE: "Germany", ES: "Spain", IT: "Italy",
  NL: "Netherlands", BE: "Belgium", CH: "Switzerland", AT: "Austria", PL: "Poland",
  SE: "Sweden", NO: "Norway", FI: "Finland", DK: "Denmark", RU: "Russia",
  UA: "Ukraine", CN: "China", JP: "Japan", KR: "South Korea", IN: "India",
  PK: "Pakistan", BD: "Bangladesh", VN: "Vietnam", TH: "Thailand", ID: "Indonesia",
  MY: "Malaysia", SG: "Singapore", PH: "Philippines", AU: "Australia", NZ: "New Zealand",
  ZA: "South Africa", NG: "Nigeria", EG: "Egypt", KE: "Kenya", MA: "Morocco",
  AE: "UAE", SA: "Saudi Arabia", IL: "Israel", TR: "Turkey", IR: "Iran",
  IQ: "Iraq", PT: "Portugal", IE: "Ireland", GR: "Greece", CZ: "Czech Republic",
  RO: "Romania", HU: "Hungary", CL: "Chile", CO: "Colombia", PE: "Peru", VE: "Venezuela",
};

interface CountryData {
  code: string;
  name: string;
  count: number;
}

interface BotDetectionWorldMapProps {
  countryDistribution: CountryData[];
  totalEvents: number;
  onCountryClick?: (countryCode: string) => void;
}

const BotDetectionWorldMap = ({
  countryDistribution,
  totalEvents,
  onCountryClick,
}: BotDetectionWorldMapProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Create a map of country codes to counts for quick lookup
  const countryCountMap = useMemo(() => {
    const map = new Map<string, CountryData>();
    countryDistribution.forEach((country) => {
      map.set(country.code, country);
    });
    return map;
  }, [countryDistribution]);

  // Calculate max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...countryDistribution.map((c) => c.count), 1);
  }, [countryDistribution]);

  // Get color based on count intensity
  const getCountryColor = useCallback((countryCode: string) => {
    const data = countryCountMap.get(countryCode);
    if (!data) {
      return "hsl(var(--muted))";
    }
    
    // Scale from light to dark red based on count
    const intensity = Math.pow(data.count / maxCount, 0.5);
    const lightness = 70 - intensity * 45;
    const saturation = 60 + intensity * 30;
    
    return `hsl(0 ${saturation}% ${lightness}%)`;
  }, [countryCountMap, maxCount]);

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.5, 4));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.5, 1));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Convert geo coordinates to SVG coordinates (simple equirectangular projection)
  const geoToSvg = useCallback((lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return [x, y];
  }, []);

  // Generate simplified country shapes as rectangles positioned at their geographic center
  const countryElements = useMemo(() => {
    return Object.entries(COUNTRY_PATHS).map(([code, { center }]) => {
      const [cx, cy] = geoToSvg(center[0], center[1]);
      const countryData = countryCountMap.get(code);
      const hasEvents = !!countryData;
      
      // Size based on rough country area (simplified)
      const sizes: Record<string, [number, number]> = {
        RU: [200, 80], US: [100, 50], CA: [100, 50], CN: [80, 50], BR: [70, 60],
        AU: [80, 50], IN: [50, 50], AR: [35, 60], SA: [40, 35], MX: [40, 30],
        ID: [60, 25], IR: [40, 30], TR: [40, 15], JP: [25, 30], DE: [20, 20],
        FR: [25, 25], GB: [15, 25], IT: [15, 30], ES: [25, 20], PL: [20, 15],
        UA: [30, 15], EG: [25, 20], ZA: [30, 25], NG: [25, 20], VN: [15, 30],
        TH: [20, 30], PH: [15, 30], MY: [30, 15], PK: [30, 25], KR: [10, 15],
      };
      const [w, h] = sizes[code] || [20, 20];
      
      return (
        <rect
          key={code}
          x={cx - w / 2}
          y={cy - h / 2}
          width={w}
          height={h}
          rx={3}
          fill={getCountryColor(code)}
          stroke="hsl(var(--border))"
          strokeWidth={0.5}
          className={`transition-colors duration-200 ${hasEvents ? "cursor-pointer" : ""}`}
          onMouseEnter={() => countryData && setHoveredCountry(countryData)}
          onMouseLeave={() => setHoveredCountry(null)}
          onClick={() => hasEvents && onCountryClick?.(code)}
        >
          <title>{COUNTRY_NAMES[code] || code}</title>
        </rect>
      );
    });
  }, [countryCountMap, getCountryColor, geoToSvg, onCountryClick]);

  // Add circles for countries with events that aren't in COUNTRY_PATHS
  const additionalCountryElements = useMemo(() => {
    return countryDistribution
      .filter((c) => !COUNTRY_PATHS[c.code])
      .map((country) => {
        // Approximate position for unknown countries (center of map)
        const [cx, cy] = [400, 200];
        
        return (
          <circle
            key={country.code}
            cx={cx + (Math.random() - 0.5) * 50}
            cy={cy + (Math.random() - 0.5) * 50}
            r={8}
            fill={getCountryColor(country.code)}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            className="cursor-pointer transition-colors duration-200"
            onMouseEnter={() => setHoveredCountry(country)}
            onMouseLeave={() => setHoveredCountry(null)}
            onClick={() => onCountryClick?.(country.code)}
          >
            <title>{country.name}</title>
          </circle>
        );
      });
  }, [countryDistribution, getCountryColor, onCountryClick]);

  return (
    <div className="relative">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleReset}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* Hover Tooltip */}
      {hoveredCountry && (
        <div className="absolute top-2 left-2 z-10 bg-popover border rounded-md shadow-md px-3 py-2 text-sm pointer-events-none">
          <p className="font-medium">
            {getCountryFlag(hoveredCountry.code)} {hoveredCountry.name}
          </p>
          <p className="text-muted-foreground">
            {hoveredCountry.count} events (
            {totalEvents > 0
              ? Math.round((hoveredCountry.count / totalEvents) * 100)
              : 0}
            %)
          </p>
        </div>
      )}

      {/* Map */}
      <div className="overflow-hidden rounded-md bg-muted/20 border">
        <svg
          ref={svgRef}
          viewBox="0 0 800 400"
          className="w-full h-[300px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default" }}
        >
          <g
            transform={`translate(${400 + pan.x}, ${200 + pan.y}) scale(${zoom}) translate(-400, -200)`}
          >
            {/* Ocean background */}
            <rect x="0" y="0" width="800" height="400" fill="hsl(var(--background))" />
            
            {/* Grid lines for reference */}
            {[0, 100, 200, 300, 400, 500, 600, 700, 800].map((x) => (
              <line
                key={`v-${x}`}
                x1={x}
                y1={0}
                x2={x}
                y2={400}
                stroke="hsl(var(--border))"
                strokeWidth={0.3}
                strokeDasharray="2,4"
              />
            ))}
            {[0, 100, 200, 300, 400].map((y) => (
              <line
                key={`h-${y}`}
                x1={0}
                y1={y}
                x2={800}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth={0.3}
                strokeDasharray="2,4"
              />
            ))}
            
            {/* Country shapes */}
            {countryElements}
            {additionalCountryElements}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--muted))" }} />
          <span>No events</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(0 60% 70%)" }} />
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(0 75% 50%)" }} />
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(0 90% 25%)" }} />
          <span className="ml-1">Low → High</span>
        </div>
      </div>
    </div>
  );
};

export default BotDetectionWorldMap;
