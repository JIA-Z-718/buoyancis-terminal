import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, AlertTriangle } from "lucide-react";

const GaiaTestSection = () => {
  const [phase, setPhase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setPhase(prev => {
        if (prev >= 5) {
          setIsRunning(false);
          setHasRun(true);
          return 5;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const startSimulation = () => {
    setPhase(0);
    setIsRunning(true);
    setHasRun(false);
  };

  const getStatusColor = () => {
    if (phase === 0) return "text-white/40";
    if (phase < 4) return "text-red-400";
    return "text-emerald-400";
  };

  const getStatusText = () => {
    if (phase === 0) return "STANDBY";
    if (phase === 1) return "ATTACK DETECTED";
    if (phase === 2) return "ANALYZING MASS...";
    if (phase === 3) return "FILTERING ZERO-MASS";
    if (phase === 4) return "SIGNAL STABLE";
    return "DEFLECTED";
  };

  return (
    <section className="min-h-screen py-24 relative overflow-hidden">
      {/* Warning stripes background for attack phase */}
      <AnimatePresence>
        {isRunning && phase > 0 && phase < 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(239,68,68,0.5) 35px, rgba(239,68,68,0.5) 70px)`
            }}
          />
        )}
      </AnimatePresence>

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-emerald-400/60 text-xs tracking-[0.3em] uppercase font-mono flex items-center gap-2">
            <Shield className="w-3 h-3" />
            System Resilience
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-white/90 mt-4">
            The Gaia Test
          </h2>
        </motion.div>

        {/* Simulation Module */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border border-white/10 bg-black/50"
        >
          {/* Header Bar */}
          <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${phase > 0 && phase < 4 ? 'bg-red-400 animate-pulse' : phase >= 4 ? 'bg-emerald-400' : 'bg-white/30'}`} />
              <span className="text-white/60 text-sm font-mono">ATTACK_SIMULATION.exe</span>
            </div>
            <button
              onClick={startSimulation}
              disabled={isRunning}
              className="px-4 py-1.5 text-xs font-mono border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors disabled:opacity-50"
            >
              {isRunning ? "RUNNING..." : "RUN TEST"}
            </button>
          </div>

          {/* Simulation Content */}
          <div className="p-8 md:p-12">
            {/* Scenario */}
            <div className="mb-8">
              <p className="text-white/40 text-xs font-mono mb-2">SCENARIO:</p>
              <p className="text-white/80 text-lg">
                Attack Vector: <span className="text-red-400 font-mono">1,000,000 Bot Swarm</span>
              </p>
            </div>

            {/* Status */}
            <div className="mb-12">
              <p className="text-white/40 text-xs font-mono mb-2">STATUS:</p>
              <motion.p 
                key={phase}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-2xl md:text-3xl font-mono ${getStatusColor()}`}
              >
                {getStatusText()}
              </motion.p>
            </div>

            {/* Visual Representation */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Attacker Side */}
              <div className="border border-red-500/20 bg-red-500/5 p-6 relative overflow-hidden">
                <AlertTriangle className="absolute top-4 right-4 w-4 h-4 text-red-400/40" />
                <p className="text-red-400/60 text-xs font-mono mb-4">ATTACKER NODES</p>
                <motion.p 
                  className="text-3xl font-mono text-red-400/80"
                  animate={{ 
                    opacity: phase >= 3 ? 0.3 : 1,
                    scale: phase >= 3 ? 0.9 : 1
                  }}
                >
                  1,000,000
                </motion.p>
                <p className="text-white/30 text-xs mt-2">Mass per node: 0.00001</p>
                <div className="mt-4 h-1 bg-white/5 rounded overflow-hidden">
                  <motion.div 
                    className="h-full bg-red-500/40"
                    animate={{ 
                      width: phase >= 3 ? "0%" : "100%"
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {phase >= 3 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400/60 text-xs mt-2 font-mono"
                  >
                    GRAVITATIONAL PULL: 0
                  </motion.p>
                )}
              </div>

              {/* Truth Signal Side */}
              <div className="border border-emerald-500/20 bg-emerald-500/5 p-6 relative overflow-hidden">
                <Zap className="absolute top-4 right-4 w-4 h-4 text-emerald-400/40" />
                <p className="text-emerald-400/60 text-xs font-mono mb-4">TRUTH SIGNAL</p>
                <motion.p 
                  className="text-3xl font-mono"
                  animate={{ 
                    color: phase >= 4 ? "#34d399" : "rgba(255,255,255,0.6)"
                  }}
                >
                  STABLE
                </motion.p>
                <p className="text-white/30 text-xs mt-2">Verified mass: 847,293</p>
                <div className="mt-4 h-1 bg-white/5 rounded overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500"
                    animate={{ 
                      width: phase >= 4 ? "100%" : "60%"
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {phase >= 4 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-400 text-xs mt-2 font-mono"
                  >
                    INTEGRITY: 100%
                  </motion.p>
                )}
              </div>
            </div>

            {/* Result */}
            <AnimatePresence>
              {phase >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-white/10 pt-8"
                >
                  <p className="text-white/40 text-xs font-mono mb-2">ANALYSIS:</p>
                  <p className="text-white/70 leading-relaxed">
                    Low-mass nodes generated <span className="text-red-400 font-mono">zero gravitational pull</span>.
                    <br />
                    Signal remained <span className="text-emerald-400 font-mono">stable and unperturbed</span>.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 border-l-2 border-[#d4af37]/40 pl-6"
        >
          <p className="text-xl md:text-2xl text-white/70 font-light italic">
            "Buoyancis is the first social graph that gets{" "}
            <span className="text-[#d4af37] not-italic">stronger</span> under attack, not weaker."
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
};

export default GaiaTestSection;
