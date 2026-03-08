import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const EaccThesisSection = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  useEffect(() => {
    // Generate noise particles that get sucked into center
    const generateParticles = () => {
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150,
        size: Math.random() * 3 + 1,
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  return (
    <section className="min-h-screen py-24 relative bg-[#000000]">
      <div className="container max-w-5xl mx-auto px-6">
        {/* Heading */}
        <div className="mb-16">
          <span className="text-emerald-400/60 text-xs tracking-[0.3em] uppercase font-mono">
            e/acc Protocol
          </span>
          <h2 className="text-3xl md:text-4xl font-mono font-bold text-white mt-4">
            The Techno-Optimist Case for <span className="text-[#d4af37]">Restrictions</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="space-y-8 font-mono">
            <p className="text-emerald-400/80 text-lg leading-relaxed">
              We are not slowing down AI.
            </p>
            <p className="text-white text-xl leading-relaxed">
              We are building the <span className="text-[#d4af37]">Guardrails for Acceleration</span>.
            </p>
            <div className="border-l-2 border-emerald-500/30 pl-6 py-4">
              <p className="text-white/70 leading-relaxed">
                To accelerate civilization, we need a{" "}
                <span className="text-emerald-400">Deterministic Truth Layer</span>.
              </p>
              <p className="text-white/70 leading-relaxed mt-4">
                Buoyancis is not a social network.
              </p>
              <p className="text-[#d4af37] text-lg mt-2">
                It is a Physics Engine for Reputation.
              </p>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              We apply <span className="text-emerald-400">Gravitational Weighting</span> to consensus. 
              If you have built things <span className="text-white/80">(Mass)</span>, your signal curves spacetime. 
              If you are a bot <span className="text-white/40">(Zero Mass)</span>, you are invisible.
            </p>
          </div>

          {/* Right: Black Hole Animation */}
          <div className="relative h-80 md:h-96 flex items-center justify-center">
            {/* Event horizon */}
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-[#000000] to-[#0a0a0a] border border-[#d4af37]/20 shadow-[0_0_60px_rgba(212,175,55,0.2)]" />
            
            {/* Accretion disk */}
            <motion.div
              className="absolute w-48 h-48 rounded-full border border-[#d4af37]/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute w-64 h-64 rounded-full border border-emerald-500/10"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Noise particles being sucked in */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute bg-red-400/60 rounded-full"
                style={{ width: p.size, height: p.size }}
                initial={{ x: p.x, y: p.y, opacity: 0.8 }}
                animate={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeIn",
                }}
              />
            ))}

            {/* Pure light escaping */}
            <motion.div
              className="absolute w-1 h-40 bg-gradient-to-t from-[#d4af37] to-transparent"
              style={{ top: -60 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-1 h-40 bg-gradient-to-b from-[#d4af37] to-transparent"
              style={{ bottom: -60 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />

            {/* Labels */}
            <div className="absolute -top-4 text-[10px] font-mono text-[#d4af37]/60 tracking-wider">
              TRUTH SIGNAL
            </div>
            <div className="absolute -bottom-4 text-[10px] font-mono text-red-400/60 tracking-wider">
              NOISE ABSORPTION
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EaccThesisSection;
