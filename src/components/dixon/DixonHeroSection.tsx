import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Hexagon } from "lucide-react";

const DixonHeroSection = () => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const phases = [
    { verb: "Read.", era: "Web1", color: "text-white/40" },
    { verb: "Write.", era: "Web2", color: "text-white/60" },
    { verb: "Own.", era: "Web3", color: "text-purple-400" },
    { verb: "VERIFY.", era: "The Buoyancis Era", color: "text-violet-300" },
  ];

  useEffect(() => {
    if (currentPhase < phases.length - 1) {
      const timer = setTimeout(() => {
        setCurrentPhase(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPhase]);

  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-violet-950/20 to-purple-950/30" />
      
      {/* Network Nodes Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-violet-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Connection Lines */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent"
            style={{
              width: `${100 + Math.random() * 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Pre-header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <Hexagon className="w-4 h-4 text-violet-400" />
          <span className="font-mono text-violet-400/70 text-sm tracking-widest">
            NETWORK STATE: NODE #002 // CHRIS DIXON
          </span>
        </motion.div>

        {/* Headline - Evolution Sequence */}
        <div className="space-y-2 mb-8">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.verb}
              initial={{ opacity: 0, x: -20 }}
              animate={i <= currentPhase ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-4"
            >
              <span className={`text-4xl md:text-6xl font-light tracking-tight ${phase.color}`}>
                {phase.verb}
              </span>
              <span className="text-sm text-white/30 font-mono">
                ({phase.era})
              </span>
            </motion.div>
          ))}
        </div>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: currentPhase >= 3 ? 1 : 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg md:text-xl text-violet-300/60 mb-12 italic"
        >
          "The Missing Verb in the Next Internet."
        </motion.p>

        {/* Body Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: currentPhase >= 3 ? 1 : 0, y: currentPhase >= 3 ? 0 : 20 }}
          transition={{ delay: 0.8 }}
          className="max-w-2xl mx-auto space-y-4 text-white/60"
        >
          <p className="leading-relaxed">
            You fought for the right to <span className="text-purple-400">Own</span> our digital assets. 
            But what is an asset worth if the reality around it is fake?
          </p>
          <p className="leading-relaxed">
            In an age of infinite AI generation, <span className="text-violet-300">Verification</span> is 
            the ultimate utility. We are building the <span className="text-violet-400">"Proof of Truth"</span> layer 
            for the decentralized web.
          </p>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: currentPhase >= 3 ? 1 : 0 }}
          transition={{ delay: 1.5 }}
          className="mt-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-violet-500/40 text-sm"
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default DixonHeroSection;
