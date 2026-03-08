import { useMemo } from "react";

type BinaryColumn = {
  id: number;
  leftPercent: number;
  chars: string;
  durationSeconds: number;
  delaySeconds: number;
  opacity: number;
  fontSizePx: number;
};

export function BinaryRain({ opacity = 0.1 }: { opacity?: number }) {
  const columns = useMemo<BinaryColumn[]>(() => {
    const count = 48;
    return Array.from({ length: count }, (_, i) => {
      const rows = 26;
      const chars = Array.from({ length: rows }, () => (Math.random() > 0.5 ? "1" : "0")).join("\n");
      return {
        id: i,
        leftPercent: (i / count) * 100,
        chars,
        // Slow + subtle
        durationSeconds: 28 + Math.random() * 32,
        delaySeconds: Math.random() * 8,
        opacity: opacity * (0.7 + Math.random() * 0.6),
        fontSizePx: 10 + Math.floor(Math.random() * 3),
      };
    });
  }, [opacity]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute font-mono leading-tight whitespace-pre text-white/10"
          style={{
            left: `${col.leftPercent}%`,
            opacity: col.opacity,
            fontSize: `${col.fontSizePx}px`,
            animation: `node010BinaryFall ${col.durationSeconds}s linear ${col.delaySeconds}s infinite`,
          }}
        >
          {col.chars}
        </div>
      ))}
      <style>{`
        @keyframes node010BinaryFall {
          0% { transform: translateY(-120%); }
          100% { transform: translateY(120vh); }
        }
      `}</style>
    </div>
  );
}
