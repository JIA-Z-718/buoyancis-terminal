import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

const SovereignPitch = () => {
  const [simulating, setSimulating] = useState(false);
  const [phase, setPhase] = useState(0);
  const [botCount, setBotCount] = useState(1000000);
  const [truthMass, setTruthMass] = useState(1);

  useEffect(() => {
    if (!simulating) return;

    const interval = setInterval(() => {
      setPhase((p) => {
        if (p >= 4) {
          setSimulating(false);
          return 4;
        }
        return p + 1;
      });

      if (phase === 1) setBotCount(750000);
      if (phase === 2) setBotCount(100000);
      if (phase === 3) {
        setBotCount(0);
        setTruthMass(1000000);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [simulating, phase]);

  const runSimulation = () => {
    setPhase(0);
    setBotCount(1000000);
    setTruthMass(1);
    setSimulating(true);
  };

  const reset = () => {
    setPhase(0);
    setBotCount(1000000);
    setTruthMass(1);
    setSimulating(false);
  };

  return (
    <section className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
      {/* Scanline overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`
        }}
      />

      <div className="container max-w-4xl mx-auto px-6 py-24 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-20"
        >
          <div className="flex items-center gap-2 text-[#d4af37]/60 text-xs mb-4">
            <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse" />
            <span>PROTOCOL v1.0 // NODE #001</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2">
            The Mathematics of Truth
          </h1>
          <p className="text-white/40 text-sm">A Gravitational Approach to Reputation</p>
        </motion.div>

        {/* Core Formula */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="border border-white/10 bg-black p-8 md:p-12">
            <p className="text-[#d4af37]/80 text-xs tracking-[0.3em] uppercase mb-8">
              Gravitational Weighting
            </p>
            
            <div className="text-center mb-8">
              <p className="text-2xl md:text-4xl text-white/90 font-light tracking-wide">
                I = G × M<sub className="text-lg">obs</sub> × M<sub className="text-lg">target</sub> / r²
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 text-sm border-t border-white/10 pt-8">
              <div>
                <span className="text-[#d4af37]">I</span>
                <span className="text-white/40 ml-2">Influence</span>
              </div>
              <div>
                <span className="text-[#d4af37]">M<sub>obs</sub></span>
                <span className="text-white/40 ml-2">Observer Mass</span>
              </div>
              <div>
                <span className="text-[#d4af37]">M<sub>target</sub></span>
                <span className="text-white/40 ml-2">Target Mass</span>
              </div>
              <div>
                <span className="text-[#d4af37]">r</span>
                <span className="text-white/40 ml-2">Relevance Distance</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Insight */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16 border-l-2 border-[#d4af37]/50 pl-6"
        >
          <p className="text-lg text-white/70 leading-relaxed">
            Mass cannot be faked. A million zero-mass nodes exert zero gravitational pull.
          </p>
          <p className="text-white/40 text-sm mt-2">
            — The First Law of Reputation Physics
          </p>
        </motion.div>

        {/* Simulation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <div className="border border-white/10 bg-black">
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[#d4af37]/80 text-xs tracking-[0.2em] uppercase">
                  Simulation
                </span>
                <span className="text-white/30 text-xs">
                  1,000,000 Bots vs. 1 Truth Node
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  Run
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs border border-white/20 text-white/60 hover:bg-white/5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Bots */}
                <div className="text-center">
                  <p className="text-white/40 text-xs mb-4">BOT SWARM</p>
                  <motion.p 
                    key={botCount}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className={`text-4xl md:text-5xl font-light tabular-nums ${botCount === 0 ? 'text-red-500/60' : 'text-white/80'}`}
                  >
                    {botCount.toLocaleString()}
                  </motion.p>
                  <p className="text-white/30 text-xs mt-2">nodes</p>
                  <div className="mt-6 h-2 bg-white/5 rounded overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-500/40"
                      initial={{ width: "100%" }}
                      animate={{ width: `${(botCount / 1000000) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-white/20 text-xs mt-2">
                    Mass: <span className="text-white/40">0.00001</span> each
                  </p>
                </div>

                {/* Truth Node */}
                <div className="text-center">
                  <p className="text-white/40 text-xs mb-4">TRUTH NODE</p>
                  <motion.p 
                    key={truthMass}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className={`text-4xl md:text-5xl font-light tabular-nums ${phase === 4 ? 'text-[#d4af37]' : 'text-white/80'}`}
                  >
                    1
                  </motion.p>
                  <p className="text-white/30 text-xs mt-2">node</p>
                  <div className="mt-6 h-2 bg-white/5 rounded overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#d4af37]"
                      initial={{ width: "0.0001%" }}
                      animate={{ width: phase >= 4 ? "100%" : `${Math.min(truthMass / 10000, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-white/20 text-xs mt-2">
                    Mass: <motion.span 
                      className="text-[#d4af37]/80"
                      key={truthMass}
                    >
                      {truthMass.toLocaleString()}
                    </motion.span>
                  </p>
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {phase >= 4 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-12 text-center border-t border-white/10 pt-8"
                  >
                    <p className="text-[#d4af37] text-lg">
                      Truth Signal Collapsed
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      1M × 0.00001 = 10 &nbsp;|&nbsp; 1 × 1,000,000 = 1,000,000
                    </p>
                    <p className="text-white/60 text-xs mt-4 font-mono">
                      Gravitational Dominance: <span className="text-[#d4af37]">100,000:1</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase Indicator */}
              {simulating && phase < 4 && (
                <div className="mt-8 text-center">
                  <p className="text-white/30 text-xs animate-pulse">
                    {phase === 0 && "Initializing gravitational field..."}
                    {phase === 1 && "Applying mass verification..."}
                    {phase === 2 && "Filtering zero-mass nodes..."}
                    {phase === 3 && "Collapsing truth signal..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* The Pitch */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="border border-[#d4af37]/20 bg-[#d4af37]/5 p-8 md:p-12"
        >
          <p className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase mb-6">
            The Proposition
          </p>
          <div className="space-y-6 text-white/70">
            <p>Global wealth: <span className="text-white">€460 Trillion</span></p>
            <p>Target dominion: <span className="text-white">55%</span> = <span className="text-[#d4af37]">€253 Trillion</span></p>
            <p>Success probability priced: <span className="text-white">0.001%</span></p>
            <p className="pt-4 border-t border-[#d4af37]/20">
              Present valuation: <span className="text-[#d4af37] text-xl">$3B</span>
            </p>
          </div>
          <p className="text-white/40 text-xs mt-8">
            If you believe the probability exceeds zero, this is mispriced.
          </p>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 text-center"
        >
          <p className="text-white/20 text-xs tracking-wider">
            BUOYANCIS PROTOCOL // GENESIS NODE SERIES
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SovereignPitch;
