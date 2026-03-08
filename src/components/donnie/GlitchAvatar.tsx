import { motion } from "framer-motion";
import { Video, Wifi } from "lucide-react";

const GlitchAvatar = () => {
  return (
    <div className="relative">
      {/* Outer container with terminal styling */}
      <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-white/10 bg-black/50 backdrop-blur-xl">
        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-20"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.03) 2px,
              rgba(255, 255, 255, 0.03) 4px
            )`,
          }}
        />

        {/* Static noise effect */}
        <motion.div
          className="absolute inset-0 z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
          animate={{
            opacity: [0.1, 0.2, 0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Glitch color shifts */}
        <motion.div
          className="absolute inset-0 z-10 mix-blend-screen"
          style={{
            background: "linear-gradient(90deg, rgba(255,0,0,0.1) 0%, transparent 50%, rgba(0,255,255,0.1) 100%)",
          }}
          animate={{
            x: [-5, 5, -3, 4, 0],
            opacity: [0, 0.5, 0, 0.3, 0],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />

        {/* Main avatar area */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a]">
          {/* Abstract face representation */}
          <motion.div
            className="relative"
            animate={{
              y: [0, -2, 0, 2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            {/* Silhouette */}
            <div className="w-20 h-24 rounded-t-full bg-gradient-to-b from-white/10 to-transparent" />
            
            {/* Eyes - glowing */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4">
              <motion.div
                className="w-2 h-2 rounded-full bg-[#D4AF37]"
                animate={{
                  opacity: [1, 0.5, 1],
                  boxShadow: [
                    "0 0 10px #D4AF37",
                    "0 0 5px #D4AF37",
                    "0 0 10px #D4AF37",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-[#D4AF37]"
                animate={{
                  opacity: [1, 0.5, 1],
                  boxShadow: [
                    "0 0 10px #D4AF37",
                    "0 0 5px #D4AF37",
                    "0 0 10px #D4AF37",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
              />
            </div>
          </motion.div>
        </div>

        {/* Glitch slice effect */}
        <motion.div
          className="absolute inset-0 overflow-hidden z-15"
          animate={{
            clipPath: [
              "inset(0% 0% 100% 0%)",
              "inset(40% 0% 50% 0%)",
              "inset(0% 0% 100% 0%)",
              "inset(70% 0% 20% 0%)",
              "inset(0% 0% 100% 0%)",
            ],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          <div
            className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a]"
            style={{ transform: "translateX(5px)" }}
          />
        </motion.div>

        {/* Video call indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-30">
          <Video className="w-3 h-3 text-red-500" />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-red-500"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>

        {/* Connection status */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-30">
          <Wifi className="w-3 h-3 text-green-500/70" />
        </div>

        {/* Bottom bar - Zoom style */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 border-t border-white/5">
          <span className="font-mono text-xs text-white/50 tracking-wider">
            DONNIE • ZOOM
          </span>
        </div>
      </div>

      {/* Outer glow */}
      <div
        className="absolute -inset-2 rounded-xl -z-10"
        style={{
          background: "radial-gradient(ellipse at center, rgba(212, 175, 55, 0.1) 0%, transparent 70%)",
        }}
      />
    </div>
  );
};

export default GlitchAvatar;
