import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col justify-center relative overflow-hidden">
      {/* Data stream background - green to gold transition */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[10px] font-mono whitespace-nowrap"
            style={{
              left: `${Math.random() * 100}%`,
              top: -20,
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: "100vh",
              opacity: [0, 0.3, 0.3, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          >
            <span 
              className="bg-gradient-to-b from-emerald-500/40 via-emerald-400/30 to-[#d4af37]/40 bg-clip-text text-transparent"
            >
              {Array.from({ length: 30 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Pre-header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 border border-emerald-500/30 bg-emerald-500/5 rounded-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400/80 text-xs tracking-[0.3em] uppercase font-mono">
              Access Granted: Node #088 // Roelof Botha
            </span>
          </div>
        </motion.div>

        {/* Main Headlines */}
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-light text-white/90 leading-tight"
          >
            In 2000, you solved
            <br />
            <span className="text-emerald-400">the transfer of Value.</span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-light text-white/90 leading-tight"
          >
            In 2026, we solve
            <br />
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f5d998] bg-clip-text text-transparent">
              the verification of Truth.
            </span>
          </motion.h2>
        </div>

        {/* Sub-text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-16 max-w-2xl"
        >
          <p className="text-white/50 text-lg md:text-xl leading-relaxed font-light">
            The internet has solved distribution. It has solved payment.
            <br />
            <span className="text-white/70">But it has lost its immune system.</span>
          </p>
          <p className="text-[#d4af37]/80 text-xl md:text-2xl mt-6 font-light tracking-wide">
            Welcome to the Verification Layer.
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2"
          >
            <div className="w-1 h-2 bg-[#d4af37]/60 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
