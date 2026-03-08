import { useState, useCallback } from "react";

interface Signal {
  id: string;
  city: string;
  /** Percentage position on a mercator-ish world projection */
  x: number;
  y: number;
  review: string;
  score: number;
}

const SIGNALS: Signal[] = [
  { id: "stk", city: "Stockholm", x: 55.5, y: 24, review: "Best coffee for deep work", score: 9.2 },
  { id: "tky", city: "Tokyo", x: 82, y: 38, review: "Authentic izakaya experience", score: 9.5 },
  { id: "nyc", city: "New York", x: 27, y: 36, review: "Top-tier rooftop cocktails", score: 8.8 },
  { id: "ldn", city: "London", x: 49, y: 28, review: "Historic pub, real ales", score: 9.0 },
  { id: "syd", city: "Sydney", x: 87, y: 72, review: "Harbour-view brunch spot", score: 9.3 },
  { id: "sfo", city: "San Francisco", x: 14, y: 38, review: "Farm-to-table pioneer", score: 8.9 },
  { id: "dxb", city: "Dubai", x: 64, y: 44, review: "World-class fine dining", score: 9.1 },
  { id: "sao", city: "São Paulo", x: 33, y: 68, review: "Vibrant street food scene", score: 8.7 },
];

/** Minimal continent outlines — thin SVG paths, deliberately abstract */
const ContinentOutlines = () => (
  <g className="text-foreground/[0.04]" fill="none" stroke="currentColor" strokeWidth="0.6">
    {/* North America – simplified */}
    <path d="M60,95 Q80,80 95,95 L115,80 Q130,70 140,80 L150,90 Q145,110 135,120 L125,135 Q118,140 110,138 L100,145 Q85,155 80,140 L70,130 Q58,115 60,95Z" />
    {/* South America */}
    <path d="M115,175 Q125,165 130,170 L135,185 Q140,210 135,235 L125,255 Q115,265 110,250 L105,230 Q100,200 105,180Z" />
    {/* Europe */}
    <path d="M215,75 Q230,65 245,72 L255,80 Q260,90 250,95 L240,100 Q225,105 218,95 L215,85Z" />
    {/* Africa */}
    <path d="M225,120 Q240,110 255,118 L260,135 Q265,165 255,195 L245,210 Q235,215 228,200 L222,175 Q218,145 225,120Z" />
    {/* Asia – simplified blob */}
    <path d="M265,60 Q290,45 330,50 L360,55 Q385,60 395,80 L400,100 Q395,120 380,115 L360,110 Q330,115 310,105 L290,100 Q270,95 265,80Z" />
    {/* Australia */}
    <path d="M365,210 Q385,200 400,210 L405,225 Q400,240 385,240 L370,235 Q360,225 365,210Z" />
  </g>
);

const SignalMap = () => {
  const [active, setActive] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleEnter = useCallback(
    (id: string, e: React.MouseEvent<SVGGElement>) => {
      const rect = (e.currentTarget.closest("svg") as SVGSVGElement)?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setTooltipPos({ x: cx, y: cy });
      setActive(id);
    },
    [],
  );

  const handleLeave = useCallback(() => setActive(null), []);

  const activeSignal = SIGNALS.find((s) => s.id === active);

  return (
    <div className="relative w-full h-full select-none">
      <svg
        viewBox="0 0 460 310"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        aria-label="Interactive signal map showing global trust nodes"
      >
        <ContinentOutlines />

        {/* Connection lines between nodes – very faint */}
        <g stroke="hsl(var(--gold))" strokeWidth="0.3" opacity="0.08">
          {SIGNALS.map((a, i) =>
            SIGNALS.slice(i + 1).map((b) => {
              const ax = (a.x / 100) * 460;
              const ay = (a.y / 100) * 310;
              const bx = (b.x / 100) * 460;
              const by = (b.y / 100) * 310;
              return (
                <line
                  key={`${a.id}-${b.id}`}
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                />
              );
            }),
          )}
        </g>

        {/* Signal dots */}
        {SIGNALS.map((s) => {
          const cx = (s.x / 100) * 460;
          const cy = (s.y / 100) * 310;
          const isActive = active === s.id;

          return (
            <g
              key={s.id}
              onMouseEnter={(e) => handleEnter(s.id, e)}
              onMouseLeave={handleLeave}
              className="cursor-pointer"
              role="button"
              aria-label={`${s.city} signal`}
            >
              {/* Ping ring */}
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 14 : 10}
                fill="none"
                stroke="hsl(var(--gold))"
                strokeWidth="0.5"
                opacity={isActive ? 0.5 : 0.15}
                className="transition-all duration-300"
              >
                <animate
                  attributeName="r"
                  from="4"
                  to="14"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.35"
                  to="0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Core dot */}
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 3.5 : 2.5}
                fill="hsl(var(--gold))"
                opacity={isActive ? 0.9 : 0.45}
                className="transition-all duration-200"
              />

              {/* Hit-area (larger invisible circle for easier hover) */}
              <circle cx={cx} cy={cy} r="12" fill="transparent" />
            </g>
          );
        })}
      </svg>

      {/* Tooltip – rendered as HTML overlay for crisp text */}
      {activeSignal && (
        <div
          className="absolute z-20 pointer-events-none animate-fade-in"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(-50%, -120%)",
          }}
        >
          <div className="rounded-lg border border-[hsl(var(--gold)/0.2)] bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg min-w-[180px]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--gold))] font-medium mb-1">
              {activeSignal.city}
            </p>
            <p className="text-xs text-foreground/80 leading-snug mb-1.5">
              "{activeSignal.review}"
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              Score:{" "}
              <span className="text-[hsl(var(--gold))] font-semibold">
                {activeSignal.score.toFixed(1)}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalMap;
