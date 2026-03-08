import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import digitalLotusHero from "@/assets/digital-lotus-hero.jpg";

const YiRenHeroSection = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section className="min-h-screen flex flex-col justify-center relative overflow-hidden bg-[#000000]">
      {/* Digital Lotus Background */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: loaded ? 0.6 : 0, scale: loaded ? 1 : 1.1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src={digitalLotusHero} 
            alt="Digital Lotus - The Heart of the Protocol"
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
        </motion.div>
      </div>

      {/* Breathing jade glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Subtle golden pulse at center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Pre-header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 1 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-4 px-5 py-3 border border-emerald-400/30 bg-black/60 backdrop-blur-sm">
            <span className="text-3xl font-serif text-[#d4af37]">九</span>
            <div className="w-px h-8 bg-white/10" />
            <span className="text-emerald-400/90 text-xs tracking-[0.2em] uppercase font-mono">
              CULTURAL KERNEL: NODE #009 // YI REN ÖSTE
            </span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight tracking-tight">
            在東西方的交匯處，
            <br />
            <span className="text-emerald-400">重力</span>不是拉力，
            <br />
            是<span className="text-[#d4af37]">歸宿</span>。
          </h1>

          <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-white/60 leading-relaxed italic">
            "Where East meets West, Gravity is not force — it is <span className="text-[#d4af37]">Home</span>."
          </h2>
        </motion.div>

        {/* Body text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 max-w-2xl"
        >
          <p className="text-white/60 text-lg leading-relaxed font-light">
            We are building a machine to verify truth.
          </p>
          <p className="text-white/60 text-lg leading-relaxed font-light mt-4">
            But truth is not just a mathematical calculation. 
            Sometimes, it is a <span className="text-emerald-400/80">feeling</span>.
          </p>
          <p className="text-white/50 text-lg leading-relaxed font-light mt-6">
            The West calls it <span className="text-white/70">"Gut Feeling."</span>
            <br />
            The East calls it <span className="text-[#d4af37]/80">"氣" (Qi)</span>.
          </p>
          <p className="text-white/80 text-xl leading-relaxed font-light mt-8 border-l-2 border-[#d4af37]/50 pl-6">
            Node #009 is the guardian of the <span className="text-[#d4af37]">Human Element</span> in a digital world.
          </p>
        </motion.div>

        {/* Chinese character decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.04 }}
          transition={{ duration: 2, delay: 1 }}
          className="absolute -right-20 top-1/2 -translate-y-1/2 text-[20rem] font-serif text-emerald-400 pointer-events-none select-none"
        >
          心
        </motion.div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-20 h-20 border-l border-t border-emerald-400/20" />
      <div className="absolute top-8 right-8 w-20 h-20 border-r border-t border-[#d4af37]/20" />
      <div className="absolute bottom-8 left-8 w-20 h-20 border-l border-b border-[#d4af37]/20" />
      <div className="absolute bottom-8 right-8 w-20 h-20 border-r border-b border-emerald-400/20" />
    </section>
  );
};

export default YiRenHeroSection;
