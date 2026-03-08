import { motion } from "framer-motion";

const LegacySection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-gradient-to-b from-[#0a0a0a] via-[#0d1a14] to-[#0a0a0a]">
      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <div className="mb-16">
          <span className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-light">
            The Symbolism
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-white mt-4 tracking-tight">
            Why <span className="text-[#d4af37]">Node #009</span>?
          </h2>
        </div>

        {/* Numerology explanation */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-[8rem] md:text-[10rem] font-serif text-[#d4af37]/20 leading-none mb-4">
              九
            </div>
            <p className="text-white/60 font-light text-lg">
              In Eastern numerology, <span className="text-[#d4af37]">九 (Nine)</span> represents:
            </p>
          </motion.div>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="border-l-2 border-[#d4af37]/30 pl-6">
              <h3 className="text-[#d4af37] font-light text-xl mb-2">長久 · Longevity</h3>
              <p className="text-white/40 font-light">
                The longest-lasting number. The guardian of endurance.
              </p>
            </div>
            <div className="border-l-2 border-emerald-400/30 pl-6">
              <h3 className="text-emerald-400 font-light text-xl mb-2">極數 · The Ultimate</h3>
              <p className="text-white/40 font-light">
                The highest single digit. The maximum before transformation.
              </p>
            </div>
            <div className="border-l-2 border-white/20 pl-6">
              <h3 className="text-white/80 font-light text-xl mb-2">龍的數字 · The Dragon's Number</h3>
              <p className="text-white/40 font-light">
                Reserved for emperors. A symbol of ultimate power and blessing.
              </p>
            </div>
          </motion.div>
        </div>

        {/* The family legacy statement */}
        <motion.div 
          className="border border-[#d4af37]/20 bg-[#d4af37]/5 p-8 md:p-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-white/60 text-lg font-light leading-relaxed mb-6">
            If Buoyancis succeeds, it will not just be code.
          </p>
          <p className="text-white text-xl md:text-2xl font-light leading-relaxed mb-6">
            It will be a <span className="text-[#d4af37]">family legacy</span>.
          </p>
          <p className="text-white/50 text-lg font-light leading-relaxed">
            Rickard's science. Your wisdom. My vision.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className="text-emerald-400/60 text-sm">Shield</span>
            <span className="text-white/20">+</span>
            <span className="text-[#d4af37]/60 text-sm">Heart</span>
            <span className="text-white/20">+</span>
            <span className="text-white/60 text-sm">Vision</span>
            <span className="text-white/20">=</span>
            <span className="text-white text-sm">The Iron Triangle</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LegacySection;
