import { motion } from "framer-motion";

const InterlockingGears = () => {
  // SVG gear path generator
  const createGearPath = (
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius: number,
    teeth: number
  ) => {
    const points: string[] = [];
    const angleStep = (Math.PI * 2) / teeth;
    const toothDepth = (outerRadius - innerRadius) * 0.5;

    for (let i = 0; i < teeth; i++) {
      const angle1 = i * angleStep;
      const angle2 = angle1 + angleStep * 0.15;
      const angle3 = angle1 + angleStep * 0.35;
      const angle4 = angle1 + angleStep * 0.5;
      const angle5 = angle1 + angleStep * 0.65;
      const angle6 = angle1 + angleStep * 0.85;

      // Inner point
      points.push(
        `${cx + Math.cos(angle1) * innerRadius},${cy + Math.sin(angle1) * innerRadius}`
      );
      // Rise to tooth
      points.push(
        `${cx + Math.cos(angle2) * (innerRadius + toothDepth * 0.5)},${cy + Math.sin(angle2) * (innerRadius + toothDepth * 0.5)}`
      );
      // Tooth top start
      points.push(
        `${cx + Math.cos(angle3) * outerRadius},${cy + Math.sin(angle3) * outerRadius}`
      );
      // Tooth top end
      points.push(
        `${cx + Math.cos(angle4) * outerRadius},${cy + Math.sin(angle4) * outerRadius}`
      );
      // Fall from tooth
      points.push(
        `${cx + Math.cos(angle5) * (innerRadius + toothDepth * 0.5)},${cy + Math.sin(angle5) * (innerRadius + toothDepth * 0.5)}`
      );
      // Back to inner
      points.push(
        `${cx + Math.cos(angle6) * innerRadius},${cy + Math.sin(angle6) * innerRadius}`
      );
    }

    return `M ${points.join(" L ")} Z`;
  };

  return (
    <div className="relative w-[500px] h-[300px] flex items-center justify-center">
      {/* Glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-[80px] top-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute right-[80px] top-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(100, 180, 255, 0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      <svg
        viewBox="0 0 500 300"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 0 20px rgba(212, 175, 55, 0.3))" }}
      >
        {/* Lovable Gear (Left) */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "140px 150px" }}
        >
          <path
            d={createGearPath(140, 150, 90, 70, 12)}
            fill="none"
            stroke="url(#lovableGradient)"
            strokeWidth="2"
          />
          {/* Inner circle */}
          <circle
            cx="140"
            cy="150"
            r="40"
            fill="rgba(10, 10, 10, 0.8)"
            stroke="url(#lovableGradient)"
            strokeWidth="1.5"
          />
          {/* Center dot */}
          <circle cx="140" cy="150" r="8" fill="#D4AF37" />
        </motion.g>

        {/* Gemini Gear (Right) - Counter-rotating */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "360px 150px" }}
        >
          <path
            d={createGearPath(360, 150, 90, 70, 12)}
            fill="none"
            stroke="url(#geminiGradient)"
            strokeWidth="2"
          />
          {/* Inner circle */}
          <circle
            cx="360"
            cy="150"
            r="40"
            fill="rgba(10, 10, 10, 0.8)"
            stroke="url(#geminiGradient)"
            strokeWidth="1.5"
          />
          {/* Center dot */}
          <circle cx="360" cy="150" r="8" fill="#64B4FF" />
        </motion.g>

        {/* Connection spark in the middle */}
        <motion.circle
          cx="250"
          cy="150"
          r="4"
          fill="#fff"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ filter: "blur(1px)" }}
        />

        {/* Energy lines between gears */}
        <motion.path
          d="M 200 150 Q 250 130 300 150"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [-8, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M 200 150 Q 250 170 300 150"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: [0, -8] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="lovableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64B4FF" />
            <stop offset="100%" stopColor="#4A90D9" />
          </linearGradient>
        </defs>
      </svg>

      {/* Labels */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute left-[70px] bottom-4 text-center"
      >
        <span className="font-mono text-[#D4AF37] text-sm tracking-widest font-bold">
          LOVABLE
        </span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute right-[80px] bottom-4 text-center"
      >
        <span className="font-mono text-[#64B4FF] text-sm tracking-widest font-bold">
          GEMINI
        </span>
      </motion.div>
    </div>
  );
};

export default InterlockingGears;
