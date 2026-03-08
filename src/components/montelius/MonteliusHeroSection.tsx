import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

const MonteliusHeroSection = () => {
  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Floating Math Notations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['∇²ψ = 0', 'P(T|O) = ∫', 'λ → 0', 'Σ mᵢ', '∂/∂t', 'O(log n)'].map((formula, i) => (
          <motion.span
            key={i}
            className="absolute font-mono text-green-500/10 text-2xl"
            style={{
              left: `${10 + (i * 15)}%`,
              top: `${20 + (i * 10)}%`,
            }}
            animate={{
              opacity: [0.05, 0.15, 0.05],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            {formula}
          </motion.span>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Pre-header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <Terminal className="w-4 h-4 text-green-500" />
          <span className="font-mono text-green-500/70 text-sm tracking-widest">
            RUNTIME ENVIRONMENT: NODE #010 // PROF. JOHAN MONTELIUS
          </span>
        </motion.div>

        {/* Code Comment Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-mono text-left md:text-center"
        >
          <p className="text-green-500/50 text-lg mb-2">{"// Overriding Consensus"}</p>
          <h1 className="text-3xl md:text-5xl text-white leading-tight">
            Truth is not a <span className="text-red-400">Vote</span>.
            <br />
            It is a <span className="text-green-400">Mass</span>.
          </h1>
        </motion.div>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-mono text-lg md:text-xl text-green-500/60 mt-8 mb-12"
        >
          "The Byzantine Generals Problem... at Global Scale."
        </motion.p>

        {/* Problem Statement Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-black/80 border border-green-500/30 rounded-none p-6 text-left font-mono"
        >
          <div className="space-y-3 text-sm md:text-base">
            <div className="flex gap-4">
              <span className="text-green-500/50 w-24 shrink-0">Current State:</span>
              <span className="text-white/80">The internet has failed the Sybil Attack test.</span>
            </div>
            <div className="flex gap-4">
              <span className="text-red-500/70 w-24 shrink-0">Error:</span>
              <span className="text-white/80">Network saturated with infinite low-cost nodes (AI/Bots).</span>
            </div>
            <div className="flex gap-4">
              <span className="text-yellow-500/70 w-24 shrink-0">Result:</span>
              <span className="text-white/80">Impossible to reach consensus on "Truth".</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-green-500/20 text-green-400/80">
            We propose a new consensus mechanism. Not based on "One Node, One Vote" (Paxos/Raft), but on <span className="text-green-300">"Gravitational Weighting"</span>.
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="font-mono text-green-500/40 text-xs"
          >
            [SCROLL TO CONTINUE]
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default MonteliusHeroSection;
