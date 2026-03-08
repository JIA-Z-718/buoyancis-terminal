import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import InterlockingGears from "./InterlockingGears";
import GlitchAvatar from "./GlitchAvatar";

const ArchitectHero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Glassmorphism terminal panels */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-left panel */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: isVisible ? 0.3 : 0, x: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute top-20 left-10 w-64 h-48 rounded-lg border border-white/10 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          }}
        >
          <div className="p-4 font-mono text-[10px] text-white/30 space-y-1">
            <div className="text-[#D4AF37]/60">$ npm run build</div>
            <div className="text-green-500/50">✓ Compiled successfully</div>
            <div className="text-white/20">→ Deploying to production...</div>
            <div className="text-[#64B4FF]/50">✓ AI integration active</div>
          </div>
        </motion.div>

        {/* Bottom-right panel */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: isVisible ? 0.3 : 0, x: 0 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="absolute bottom-20 right-10 w-72 h-40 rounded-lg border border-white/10 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          }}
        >
          <div className="p-4 font-mono text-[10px] text-white/30 space-y-1">
            <div className="text-[#64B4FF]/60">gemini.analyze()</div>
            <div className="text-white/20">{"{ status: 'processing' }"}</div>
            <div className="text-[#D4AF37]/50">→ Pattern recognized</div>
            <div className="text-green-500/50">✓ Solution generated</div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Pre-header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <span className="font-mono text-[#D4AF37]/50 text-xs tracking-[0.3em] uppercase">
            Node #011 // The Architect of Tools
          </span>
        </motion.div>

        {/* Glitch Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <GlitchAvatar />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center font-mono text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-4"
        >
          DONNIE <span className="text-[#D4AF37]">SC</span> LYGONIS
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 0.7 : 0 }}
          transition={{ delay: 0.6 }}
          className="text-center font-mono text-sm text-white/50 mb-12 tracking-wider"
        >
          MENTOR • BUILDER • NETWORK NODE
        </motion.p>

        {/* Interlocking Gears */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex justify-center mb-12"
        >
          <InterlockingGears />
        </motion.div>

        {/* Tool synergy description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="font-mono text-white/60 text-sm leading-relaxed mb-6">
            "The best tools don't replace builders—they <span className="text-[#D4AF37]">amplify</span> them.
            <br />
            Donnie showed me how to <span className="text-[#64B4FF]">construct</span>, not just consume."
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 1.2 }}
          className="flex justify-center mt-16"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#D4AF37]/40 text-xl font-mono"
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ArchitectHero;
