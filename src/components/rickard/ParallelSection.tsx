import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Milk, Cpu, AlertTriangle, Brain, FlaskConical, Scale, Leaf, Shield } from "lucide-react";
import breakdownFilter from "@/assets/rickard-breakdown-filter.jpg";

const ParallelSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const comparisons = [
    {
      category: "The Incumbent",
      oatly: { icon: Milk, text: "Big Dairy (Milk)", color: "text-white/50" },
      buoyancis: { icon: Cpu, text: "Big Tech (Google/Yelp)", color: "text-white/50" },
    },
    {
      category: "The Problem",
      oatly: { icon: AlertTriangle, text: "Intolerance / Allergies", color: "text-red-400/70" },
      buoyancis: { icon: Brain, text: "Hallucinations / Fake News", color: "text-red-400/70" },
    },
    {
      category: "The Solution",
      oatly: { icon: FlaskConical, text: "Enzymatic Technology", color: "text-amber-400" },
      buoyancis: { icon: Scale, text: "Gravitational Verification", color: "text-amber-400" },
    },
    {
      category: "The Result",
      oatly: { icon: Leaf, text: "Post-Milk Generation", color: "text-green-400/80" },
      buoyancis: { icon: Shield, text: "Post-Truth Generation", color: "text-green-400/80" },
    },
  ];

  return (
    <section ref={ref} className="py-32 bg-black relative">
      {/* Subtle organic pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 70% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 40%)`,
        }}
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-16"
        >
          <span className="text-amber-400/50 text-sm tracking-widest uppercase">
            The Core Parallel
          </span>
          <h2 className="text-3xl md:text-4xl text-white mt-4 font-light">
            The <span className="text-amber-400">Lactose Intolerance</span> of the Internet
          </h2>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-amber-950/20 to-transparent border border-amber-500/20 rounded-2xl overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-amber-950/30 border-b border-amber-500/20">
            <div className="p-4 text-center text-amber-400/50 text-sm font-mono">
              DIMENSION
            </div>
            <div className="p-4 text-center text-amber-400 font-medium border-x border-amber-500/10">
              OATLY
            </div>
            <div className="p-4 text-center text-amber-300 font-medium">
              BUOYANCIS
            </div>
          </div>

          {/* Table Rows */}
          {comparisons.map((row, i) => {
            const OatlyIcon = row.oatly.icon;
            const BuoyancisIcon = row.buoyancis.icon;
            
            return (
              <motion.div
                key={row.category}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`grid grid-cols-3 ${i < comparisons.length - 1 ? 'border-b border-amber-500/10' : ''}`}
              >
                <div className="p-6 flex items-center justify-center">
                  <span className="text-white/40 text-sm font-mono">{row.category}</span>
                </div>
                <div className="p-6 flex items-center justify-center gap-3 border-x border-amber-500/10 bg-amber-950/10">
                  <OatlyIcon className={`w-5 h-5 ${row.oatly.color}`} />
                  <span className={`text-sm ${row.oatly.color}`}>{row.oatly.text}</span>
                </div>
                <div className="p-6 flex items-center justify-center gap-3">
                  <BuoyancisIcon className={`w-5 h-5 ${row.buoyancis.color}`} />
                  <span className={`text-sm ${row.buoyancis.color}`}>{row.buoyancis.text}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Visual Metaphor - The Breakdown Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="mt-16 flex flex-col md:flex-row items-center gap-8"
        >
          {/* Filter Image */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border border-amber-500/20">
              <img 
                src={breakdownFilter} 
                alt="The Breakdown: Noise to Truth" 
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </div>
          
          {/* Explanation */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h3 className="text-xl text-amber-400 font-light mb-4">The Breakdown</h3>
            <p className="text-white/60 leading-relaxed mb-4">
              Noise enters from above — chaotic, unstructured, overwhelming.
            </p>
            <p className="text-white/60 leading-relaxed mb-4">
              It passes through the <span className="text-amber-400">golden mesh of scientific rigor</span>.
            </p>
            <p className="text-amber-300/80 leading-relaxed">
              Only structured truth emerges below.
            </p>
          </div>
        </motion.div>

        {/* Equation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-6 text-white/40">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400/40" />
              <span className="text-sm">Enzymes → Oat Milk</span>
            </div>
            <span className="text-amber-500/30">=</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-300/40" />
              <span className="text-sm">Gravity → Truth</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ParallelSection;
