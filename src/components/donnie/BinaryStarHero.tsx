import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const BinaryStarHero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Canvas for particle trails between the rings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
    }> = [];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      ctx.fillStyle = "rgba(10, 10, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn particles along the ring paths
      if (Math.random() > 0.7) {
        const angle = Math.random() * Math.PI * 2;
        const ring = Math.random() > 0.5 ? 1 : 2;
        const radius = ring === 1 ? 180 : 200;
        const offsetX = ring === 1 ? -60 : 60;
        
        particles.push({
          x: centerX + offsetX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius * 0.4,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 0,
          maxLife: 60 + Math.random() * 60,
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha * 0.6})`;
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-60"
      />

      {/* Ambient glow */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px]"
          style={{
            background: "radial-gradient(ellipse at center, rgba(212, 175, 55, 0.08) 0%, transparent 70%)",
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Pre-header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <span className="font-mono text-[#D4AF37]/50 text-xs tracking-[0.3em] uppercase">
            Node #011 // The Binary Star
          </span>
        </motion.div>

        {/* Binary Star Rings */}
        <div className="relative h-[400px] flex items-center justify-center mb-16">
          {/* Left Ring - User */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -100 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
            className="absolute"
            style={{ left: "calc(50% - 160px)" }}
          >
            <motion.div
              className="w-[360px] h-[160px] border-2 border-[#D4AF37]/40 rounded-[50%]"
              style={{
                boxShadow: "0 0 40px rgba(212, 175, 55, 0.15), inset 0 0 30px rgba(212, 175, 55, 0.05)",
              }}
              animate={{
                rotateZ: [0, 360],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <motion.div
                className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#D4AF37] rounded-full"
                style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.8)" }}
              />
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 0.4 : 0 }}
              transition={{ delay: 1.2 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[#D4AF37] font-serif text-sm tracking-wider"
            >
              YOU
            </motion.span>
          </motion.div>

          {/* Right Ring - Donnie */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
            className="absolute"
            style={{ left: "calc(50% - 200px)" }}
          >
            <motion.div
              className="w-[400px] h-[180px] border-2 border-[#D4AF37]/60 rounded-[50%]"
              style={{
                boxShadow: "0 0 60px rgba(212, 175, 55, 0.2), inset 0 0 40px rgba(212, 175, 55, 0.08)",
              }}
              animate={{
                rotateZ: [0, -360],
              }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              <motion.div
                className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-[#D4AF37] rounded-full"
                style={{ boxShadow: "0 0 30px rgba(212, 175, 55, 1)" }}
              />
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 0.6 : 0 }}
              transition={{ delay: 1.4 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[#D4AF37] font-serif text-sm tracking-wider font-medium"
            >
              DONNIE
            </motion.span>
          </motion.div>

          {/* Center intersection point */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: 1 }}
            transition={{ delay: 1, type: "spring" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <motion.div
                className="w-3 h-3 rounded-full bg-[#D4AF37]"
                animate={{
                  boxShadow: [
                    "0 0 10px rgba(212, 175, 55, 0.5)",
                    "0 0 30px rgba(212, 175, 55, 0.8)",
                    "0 0 10px rgba(212, 175, 55, 0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: 0 }}
          transition={{ delay: 0.8 }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-8"
        >
          The orbit of a <span className="text-[#D4AF37]">Mentor</span>
          <br />
          shapes the trajectory of a <span className="text-[#D4AF37]">Founder</span>.
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 0.6 : 0 }}
          transition={{ delay: 1 }}
          className="font-serif text-lg md:text-xl text-white/60 max-w-2xl mx-auto italic"
        >
          "Every great company is born from a conversation that shouldn't have worked."
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 1.5 }}
          className="mt-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#D4AF37]/40 text-xl"
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default BinaryStarHero;
