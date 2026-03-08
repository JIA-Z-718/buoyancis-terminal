import { motion } from "framer-motion";

const SemmelweisParadoxSection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-gradient-to-b from-black via-[#0a0f0a] to-black overflow-hidden">
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(74, 222, 128, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 222, 128, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="text-green-500/60 text-xs tracking-[0.3em] uppercase font-mono">
            Historical Pattern Recognition
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mt-4 tracking-tight font-mono">
            Scientific Integrity &<br />
            <span className="text-green-400">The Semmelweis Paradox</span>
          </h2>
        </motion.div>

        {/* The Paradox Definition */}
        <motion.div 
          className="mb-16 border border-green-500/20 bg-green-500/[0.02] p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-green-400/80 text-xs tracking-wider uppercase font-mono mb-4">
            Pattern: Consensus vs. Truth
          </p>
          <blockquote className="text-white/80 text-xl md:text-2xl font-light leading-relaxed border-l-2 border-green-500/40 pl-6">
            "The reflex-like tendency to reject new evidence or knowledge because it contradicts established norms, beliefs, or paradigms."
          </blockquote>
          <p className="text-white/40 text-sm font-mono mt-4">
            — Named after Ignaz Semmelweis (1818-1865)
          </p>
        </motion.div>

        {/* Historical Cases */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Semmelweis Case */}
          <motion.div
            className="border border-white/10 bg-white/[0.02] p-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-green-500/40 flex items-center justify-center">
                <span className="text-green-400 text-xs font-mono">01</span>
              </div>
              <span className="text-white/60 text-sm font-mono">Vienna, 1847</span>
            </div>
            <h3 className="text-green-400 text-xl font-light mb-3">Ignaz Semmelweis</h3>
            <p className="text-white/50 text-sm font-light leading-relaxed mb-4">
              Discovered that handwashing reduced maternal mortality from 18% to 1%. 
              The medical establishment rejected his findings for decades.
            </p>
            <div className="border-t border-white/10 pt-4">
              <p className="text-white/30 text-xs font-mono">
                OUTCOME: Died in asylum. Vindicated 20 years later.
              </p>
            </div>
          </motion.div>

          {/* McClintock Case */}
          <motion.div
            className="border border-white/10 bg-white/[0.02] p-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-green-500/40 flex items-center justify-center">
                <span className="text-green-400 text-xs font-mono">02</span>
              </div>
              <span className="text-white/60 text-sm font-mono">Cold Spring Harbor, 1951</span>
            </div>
            <h3 className="text-green-400 text-xl font-light mb-3">Barbara McClintock</h3>
            <p className="text-white/50 text-sm font-light leading-relaxed mb-4">
              Discovered "jumping genes" (transposons). The scientific community 
              dismissed her work as incomprehensible for 30 years.
            </p>
            <div className="border-t border-white/10 pt-4">
              <p className="text-white/30 text-xs font-mono">
                OUTCOME: Nobel Prize, 1983. 32 years after discovery.
              </p>
            </div>
          </motion.div>
        </div>

        {/* The Problem Statement */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-red-400/80 text-xs tracking-wider uppercase font-mono mb-4">
            The Systemic Failure
          </p>
          <p className="text-white text-xl md:text-2xl font-light leading-relaxed mb-6">
            Mainstream consensus is <span className="text-red-400">not a truth function</span>.
          </p>
          <p className="text-white/60 text-lg font-light leading-relaxed">
            It is a <span className="text-white/80">social coordination mechanism</span> optimized for 
            stability, not accuracy. Professional reputation systems reward conformity. 
            Outliers with revolutionary truths are systematically filtered as noise.
          </p>
        </motion.div>

        {/* Gravitational Weighting Solution */}
        <motion.div 
          className="border border-green-500/30 bg-green-500/[0.03] p-8 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-green-400/80 text-xs tracking-wider uppercase font-mono mb-6">
            Protocol Response: Gravitational Weighting
          </p>
          
          <div className="space-y-6">
            <div className="border-l-2 border-green-500/40 pl-6">
              <h4 className="text-white text-lg font-light mb-2">Mass ≠ Popularity</h4>
              <p className="text-white/50 text-sm font-light">
                In our system, <span className="text-green-400">observational mass</span> is earned through 
                verified, high-stakes actions—not social validation or institutional credentials.
              </p>
            </div>

            <div className="border-l-2 border-green-500/40 pl-6">
              <h4 className="text-white text-lg font-light mb-2">Outlier Protection</h4>
              <p className="text-white/50 text-sm font-light">
                A single <span className="text-green-400">high-mass observer</span> with direct empirical evidence 
                can outweigh thousands of low-mass professional opinions based on inherited consensus.
              </p>
            </div>

            <div className="border-l-2 border-green-500/40 pl-6">
              <h4 className="text-white text-lg font-light mb-2">Byzantine Fault Tolerance for Truth</h4>
              <p className="text-white/50 text-sm font-light">
                The protocol is designed to reach consensus even when up to 33% of participants 
                are operating on <span className="text-green-400">paradigm inertia</span> rather than evidence.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-green-500/20">
            <p className="text-white/80 text-lg font-light leading-relaxed">
              Buoyancis doesn't ask: <span className="text-white/40">"What does the establishment believe?"</span>
            </p>
            <p className="text-green-400 text-xl font-light mt-2">
              It asks: "Who has <span className="text-white">skin in the game</span>?"
            </p>
          </div>
        </motion.div>

        {/* Provocative Closing */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-white/40 text-sm font-mono mb-4">
            // QUERY: CONSENSUS_VALIDATION
          </p>
          <p className="text-white/60 text-lg font-light">
            The next Semmelweis is alive today.
          </p>
          <p className="text-green-400 text-xl font-light mt-2">
            Will the system recognize them in time?
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SemmelweisParadoxSection;
