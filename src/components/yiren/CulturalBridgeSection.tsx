import { motion } from "framer-motion";

const CulturalBridgeSection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-[#000000]">
      {/* Subtle jade ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-400/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#d4af37]/5 to-transparent" />
      </div>

      <div className="container max-w-5xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <div className="mb-16">
          <span className="text-emerald-400/60 text-xs tracking-[0.3em] uppercase font-mono">
            Section II: The Bridge
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-white mt-4 tracking-tight">
            Connecting <span className="text-emerald-400">Two</span> <span className="text-[#d4af37]">Worlds</span>
          </h2>
        </div>

        {/* Key insight block */}
        <motion.div 
          className="border border-emerald-400/20 bg-emerald-400/5 p-8 md:p-12 mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-white/70 text-xl font-light leading-relaxed mb-6">
            To rule 55% of the world's assets, we cannot just think like <span className="text-white/90">Swedish Engineers</span>.
          </p>
          <p className="text-white/80 text-2xl font-light leading-relaxed">
            We must think with the depth of <span className="text-emerald-400">Eastern Philosophy</span>.
          </p>
        </motion.div>

        {/* The Trinity */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Rickard */}
          <motion.div 
            className="border border-white/10 bg-white/[0.02] p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl mb-4 opacity-80">🔬</div>
            <div className="mb-4">
              <span className="text-white/40 text-xs tracking-[0.2em] uppercase font-mono">Node #003</span>
            </div>
            <h3 className="text-white/90 text-lg font-light mb-3">Rickard Öste</h3>
            <p className="text-white/50 text-sm font-light leading-relaxed">
              Brings the <span className="text-white/70">Science of Change</span>.
            </p>
            <p className="text-white/40 text-xs font-mono mt-4 tracking-wider">
              ENZYME TECHNOLOGY · NOBEL NETWORK
            </p>
          </motion.div>

          {/* Yi Ren - Central */}
          <motion.div 
            className="border border-[#d4af37]/40 bg-gradient-to-b from-[#d4af37]/10 to-emerald-400/10 p-8 text-center relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-black border border-[#d4af37]/40">
              <span className="text-[#d4af37] text-xs tracking-[0.15em] font-mono">NODE #009</span>
            </div>
            <div className="text-4xl mb-4">🌸</div>
            <div className="mb-4">
              <span className="text-emerald-400/80 text-xs tracking-[0.2em] uppercase font-mono">The Bridge</span>
            </div>
            <h3 className="text-[#d4af37] text-lg font-light mb-3">Yi Ren · 任禕</h3>
            <p className="text-white/70 text-sm font-light leading-relaxed">
              Brings the <span className="text-emerald-400">Wisdom of Continuity</span>.
            </p>
            <p className="text-white/40 text-xs font-mono mt-4 tracking-wider">
              EASTERN PHILOSOPHY · INTUITION
            </p>
          </motion.div>

          {/* Founder */}
          <motion.div 
            className="border border-white/10 bg-white/[0.02] p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-4xl mb-4 opacity-80">📐</div>
            <div className="mb-4">
              <span className="text-white/40 text-xs tracking-[0.2em] uppercase font-mono">Founder</span>
            </div>
            <h3 className="text-white/90 text-lg font-light mb-3">The Architect</h3>
            <p className="text-white/50 text-sm font-light leading-relaxed">
              Brings the <span className="text-white/70">Structure of Growth</span>.
            </p>
            <p className="text-white/40 text-xs font-mono mt-4 tracking-wider">
              PROTOCOL DESIGN · VISION
            </p>
          </motion.div>
        </div>

        {/* Flow visualization */}
        <motion.div 
          className="flex items-center justify-center gap-4 py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="w-24 h-px bg-gradient-to-r from-transparent to-white/20" />
          <div className="text-white/30 text-xs font-mono tracking-widest">SYNERGY</div>
          <div className="w-24 h-px bg-gradient-to-l from-transparent to-white/20" />
        </motion.div>

        {/* The equation */}
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="font-mono text-lg md:text-xl text-white/60">
            <span className="text-white/80">Science</span> + 
            <span className="text-emerald-400"> Wisdom</span> + 
            <span className="text-[#d4af37]"> Structure</span> = 
            <span className="text-white"> Global Protocol</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CulturalBridgeSection;
