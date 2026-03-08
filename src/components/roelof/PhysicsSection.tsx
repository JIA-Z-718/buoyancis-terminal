import { motion } from "framer-motion";

const PhysicsSection = () => {
  return (
    <section className="min-h-screen py-24 relative">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(212,175,55,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-mono">
            Protocol Logic
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-white/90 mt-4">
            The Gravity Model
          </h2>
        </motion.div>

        {/* Main Formula */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-16 border border-[#d4af37]/20 bg-gradient-to-b from-[#d4af37]/5 to-transparent p-8 md:p-16 text-center"
        >
          <p className="text-white/30 text-xs font-mono mb-8 tracking-widest">
            TRUTH SIGNAL FORMULA
          </p>
          
          <div className="text-3xl md:text-5xl text-white/90 font-light tracking-wide">
            T<sub className="text-lg md:text-2xl text-[#d4af37]">signal</sub> = Σ
            <span className="mx-2 text-white/60">(</span>
            <span className="text-[#d4af37]">M</span><sub className="text-sm md:text-lg">node</sub>
            <span className="mx-2">·</span>
            <span className="text-[#d4af37]">I</span><sub className="text-sm md:text-lg">context</sub>
            <span className="mx-2 text-white/60">/</span>
            r<sup className="text-lg md:text-2xl">2</sup>
            <span className="text-white/60">)</span>
          </div>

          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent mx-auto mt-12" />
        </motion.div>

        {/* Variable Explanations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {/* M_node */}
          <div className="border border-white/10 bg-black/30 p-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl text-[#d4af37] font-light">M</span>
              <span className="text-white/40 text-xs font-mono">node</span>
            </div>
            <p className="text-white/80 text-sm font-medium mb-2">Mass</p>
            <p className="text-white/50 text-xs leading-relaxed">
              The historical integrity of the observer. Derived from verified track record 
              and consistency over time.
            </p>
          </div>

          {/* I_context */}
          <div className="border border-white/10 bg-black/30 p-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl text-[#d4af37] font-light">I</span>
              <span className="text-white/40 text-xs font-mono">context</span>
            </div>
            <p className="text-white/80 text-sm font-medium mb-2">Impact</p>
            <p className="text-white/50 text-xs leading-relaxed">
              The "Skin in the game" factor. How much the observer's reputation 
              is at stake in this specific verdict.
            </p>
          </div>

          {/* r */}
          <div className="border border-white/10 bg-black/30 p-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl text-[#d4af37] font-light">r</span>
              <span className="text-white/40 text-xs font-mono">distance</span>
            </div>
            <p className="text-white/80 text-sm font-medium mb-2">Relevance</p>
            <p className="text-white/50 text-xs leading-relaxed">
              Semantic proximity to the subject. A chef reviewing a restaurant has 
              r ≈ 0.1. Reviewing software? r ≈ 100.
            </p>
          </div>
        </motion.div>

        {/* Result */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center border-t border-white/10 pt-12"
        >
          <p className="text-lg text-white/60 font-light">
            The Result:
          </p>
          <p className="text-2xl md:text-3xl text-[#d4af37] font-light mt-4">
            A deterministic signal that collapses the noise.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PhysicsSection;
