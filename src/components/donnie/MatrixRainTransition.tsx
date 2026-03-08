import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MatrixRainTransitionProps {
  isActive: boolean;
  onComplete: () => void;
}

const MatrixRainTransition = ({ isActive, onComplete }: MatrixRainTransitionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"rain" | "clear" | "done">("rain");

  useEffect(() => {
    if (!isActive) {
      setPhase("rain");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -100);
    
    // Characters to display (mix of binary, code snippets, and kanji)
    const chars = "01アイウエオカキクケコ建設{}()=>const";

    let frameCount = 0;
    const maxFrames = 80; // Duration of rain effect

    const draw = () => {
      // Fade effect
      ctx.fillStyle = "rgba(10, 10, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Golden color with varying opacity
        const alpha = 0.8 + Math.random() * 0.2;
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
        
        // Draw character
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Reset drop when it goes off screen
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Move drop
        drops[i] += 0.5 + Math.random() * 0.5;
      }

      frameCount++;

      if (frameCount >= maxFrames) {
        setPhase("clear");
      }
    };

    const interval = setInterval(draw, 33);

    return () => clearInterval(interval);
  }, [isActive]);

  // Handle clear phase
  useEffect(() => {
    if (phase === "clear") {
      const timeout = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [phase, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Canvas for matrix rain */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{ background: "#0A0A0A" }}
          />

          {/* Clear effect - golden flash */}
          <AnimatePresence>
            {phase === "clear" && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Golden radial burst */}
                <motion.div
                  className="absolute w-full h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8 }}
                  style={{
                    background: "radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, transparent 70%)",
                  }}
                />

                {/* Center text flash */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="font-mono text-2xl md:text-4xl text-[#D4AF37] tracking-[0.2em]"
                >
                  ACCESS GRANTED
                </motion.div>

                {/* Horizontal scan lines clearing */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"
                    style={{ top: `${(i / 20) * 100}%` }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.02,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatrixRainTransition;
