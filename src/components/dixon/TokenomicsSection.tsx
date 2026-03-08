import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingDown, TrendingUp, Zap, AlertTriangle, Award } from "lucide-react";

const TokenomicsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 bg-gradient-to-b from-black via-violet-950/10 to-black relative">
      {/* Subtle Grid */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-16"
        >
          <span className="text-violet-400/50 text-sm tracking-widest uppercase">
            Economic Model
          </span>
          <h2 className="text-3xl md:text-4xl text-white mt-4 font-light">
            Fixing the <span className="text-violet-400">Tokenomics</span> of Trust
          </h2>
        </motion.div>

        {/* Web2 vs Protocol Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-8 mb-16"
        >
          {/* Web2 Model (Failed) */}
          <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="text-lg text-red-400">Web2 Model (Yelp/Google)</h3>
            </div>
            <div className="space-y-4 text-white/60 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-red-500/10">
                <span>Take Rate</span>
                <span className="text-red-400 font-mono">HIGH (30%+)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-red-500/10">
                <span>Truth Rate</span>
                <span className="text-red-400 font-mono">LOW (~40%)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Incentive</span>
                <span className="text-red-400 font-mono">Engagement</span>
              </div>
            </div>
            <p className="mt-6 text-red-400/60 text-sm italic">
              They profit from the noise.
            </p>
          </div>

          {/* Buoyancis Protocol */}
          <div className="bg-violet-950/30 border border-violet-500/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg text-violet-400">Buoyancis Protocol</h3>
            </div>
            <div className="space-y-4 text-white/60 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-violet-500/10">
                <span>Take Rate</span>
                <span className="text-violet-400 font-mono">0% (Protocol)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-violet-500/10">
                <span>Truth Rate</span>
                <span className="text-violet-400 font-mono">99%+ (Verified)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Incentive</span>
                <span className="text-violet-400 font-mono">Signal Clarity</span>
              </div>
            </div>
            <p className="mt-6 text-violet-400/60 text-sm italic">
              We reward truth, not engagement.
            </p>
          </div>
        </motion.div>

        {/* Mechanism Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {/* Staking */}
          <div className="bg-black/50 border border-violet-500/20 rounded-xl p-6 hover:border-violet-500/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-violet-400" />
            </div>
            <h4 className="text-white font-medium mb-2">Staking Mechanism</h4>
            <p className="text-white/50 text-sm leading-relaxed">
              Nodes stake <span className="text-violet-400">"Reputation Mass"</span> (not just capital). 
              Your historical integrity is your collateral.
            </p>
          </div>

          {/* Slashing */}
          <div className="bg-black/50 border border-violet-500/20 rounded-xl p-6 hover:border-violet-500/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h4 className="text-white font-medium mb-2">Slashing Condition</h4>
            <p className="text-white/50 text-sm leading-relaxed">
              If a Node verifies a hallucination, their <span className="text-red-400">gravity collapses</span>. 
              Lies have permanent cost.
            </p>
          </div>

          {/* Rewards */}
          <div className="bg-black/50 border border-violet-500/20 rounded-xl p-6 hover:border-violet-500/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="text-white font-medium mb-2">Reward Structure</h4>
            <p className="text-white/50 text-sm leading-relaxed">
              We reward <span className="text-green-400">Signal Clarity</span>, not engagement. 
              Quality over quantity, always.
            </p>
          </div>
        </motion.div>

        {/* Statement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-violet-300/60 text-lg italic">
            "Buoyancis is a protocol, not a platform."
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TokenomicsSection;
