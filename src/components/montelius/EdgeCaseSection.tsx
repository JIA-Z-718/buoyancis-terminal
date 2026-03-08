import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Shield, HelpCircle } from "lucide-react";

const EdgeCaseSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 bg-zinc-950 relative">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="mb-12"
        >
          <span className="font-mono text-green-500/50 text-xs tracking-widest">
            // SECTION 03
          </span>
          <h2 className="font-mono text-2xl md:text-3xl text-white mt-2">
            The <span className="text-yellow-400">ID2201</span> Challenge
          </h2>
        </motion.div>

        {/* Challenge Cards */}
        <div className="space-y-6">
          {/* Hypothesis */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="bg-black border border-green-500/20 p-6"
          >
            <div className="flex items-start gap-4">
              <Shield className="w-5 h-5 text-green-500 mt-1 shrink-0" />
              <div>
                <h3 className="font-mono text-green-400 text-sm mb-3">HYPOTHESIS:</h3>
                <p className="font-mono text-white/80 leading-relaxed">
                  In a network of <span className="text-red-400">10 million malicious nodes</span> (Bots) 
                  and <span className="text-green-400">100 high-integrity nodes</span> (Experts), 
                  Gravitational Consensus will maintain stability.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Risk */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="bg-black border border-yellow-500/20 p-6"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1 shrink-0" />
              <div>
                <h3 className="font-mono text-yellow-400 text-sm mb-3">THE RISK:</h3>
                <p className="font-mono text-white/80 leading-relaxed">
                  State divergence. If the gravity well is too strong, do we create a 
                  <span className="text-yellow-400"> monopoly on truth</span>?
                </p>
              </div>
            </div>
          </motion.div>

          {/* Why You */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 }}
            className="bg-black border border-green-500/30 p-6"
          >
            <div className="flex items-start gap-4">
              <HelpCircle className="w-5 h-5 text-green-400 mt-1 shrink-0" />
              <div>
                <h3 className="font-mono text-green-400 text-sm mb-3">WHY WE NEED YOU:</h3>
                <p className="font-mono text-white/80 leading-relaxed">
                  We need a Distributed Systems expert to audit the 
                  <span className="text-green-400"> "Anti-Monopoly" constraints</span> in our architecture.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Test Case Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-12 border border-green-500/20 bg-black p-6"
        >
          <div className="font-mono text-xs text-green-500/50 mb-6">
            // STRESS TEST SIMULATION
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            {/* Malicious Nodes */}
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-mono text-red-400 mb-2">
                10,000,000
              </div>
              <div className="font-mono text-xs text-white/40">
                MALICIOUS NODES
              </div>
              <div className="font-mono text-xs text-red-400/60 mt-1">
                Mass: 0.001 each
              </div>
              <div className="mt-4 h-2 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-500/30"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: "100%" } : {}}
                  transition={{ delay: 1, duration: 1 }}
                />
              </div>
              <div className="font-mono text-xs text-red-400/50 mt-2">
                Total Mass: 10,000
              </div>
            </div>

            {/* High-Integrity Nodes */}
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-mono text-green-400 mb-2">
                100
              </div>
              <div className="font-mono text-xs text-white/40">
                HIGH-INTEGRITY NODES
              </div>
              <div className="font-mono text-xs text-green-400/60 mt-1">
                Mass: 1,000 each
              </div>
              <div className="mt-4 h-2 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500/50"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: "100%" } : {}}
                  transition={{ delay: 1.2, duration: 1 }}
                />
              </div>
              <div className="font-mono text-xs text-green-400/50 mt-2">
                Total Mass: 100,000
              </div>
            </div>
          </div>

          {/* Result */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
            className="mt-8 pt-6 border-t border-green-500/20 text-center"
          >
            <div className="font-mono text-xs text-green-500/50 mb-2">CONSENSUS RATIO</div>
            <div className="font-mono text-2xl text-green-400">
              100K : 10K = <span className="text-white">10:1</span> (Expert Advantage)
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default EdgeCaseSection;
