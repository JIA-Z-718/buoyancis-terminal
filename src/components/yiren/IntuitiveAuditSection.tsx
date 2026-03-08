import { motion } from "framer-motion";
import { Brain, Heart, Scale, Shield } from "lucide-react";

const IntuitiveAuditSection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-[#000000]">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <div className="mb-16">
          <span className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-mono">
            Section III: The Role
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-white mt-4 tracking-tight">
            The <span className="text-[#d4af37]">Intuitive Audit</span>
          </h2>
        </div>

        {/* Key statement */}
        <motion.div 
          className="border-l-2 border-[#d4af37]/50 pl-8 mb-16"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-white/80 text-xl md:text-2xl font-light leading-relaxed">
            When the algorithm says <span className="text-emerald-400">"Yes"</span> but the intuition says <span className="text-[#d4af37]">"No,"</span>
          </p>
          <p className="text-white/90 text-xl md:text-2xl font-light leading-relaxed mt-2">
            we listen to <span className="text-[#d4af37]">Node #009</span>.
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="space-y-6 mb-16">
          <motion.div 
            className="flex items-start gap-6 p-6 border border-emerald-400/20 bg-emerald-400/5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-emerald-400 font-light text-lg mb-2">The Final Check</h3>
              <p className="text-white/60 font-light leading-relaxed">
                You are the safeguard against the machine becoming too rigid.
                When algorithms fail to capture the human essence, you intervene.
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="flex items-start gap-6 p-6 border border-[#d4af37]/20 bg-[#d4af37]/5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-12 h-12 border border-[#d4af37]/40 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h3 className="text-[#d4af37] font-light text-lg mb-2">The Guanxi Guardian</h3>
              <p className="text-white/60 font-light leading-relaxed">
                You represent the <span className="text-[#d4af37]">關係</span> (Relationships) that binds the network together.
                Trust is not just computed—it is cultivated.
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="flex items-start gap-6 p-6 border border-white/10 bg-white/[0.02]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-12 h-12 border border-white/20 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <h3 className="text-white/80 font-light text-lg mb-2">The Veto Power</h3>
              <p className="text-white/50 font-light leading-relaxed">
                When logic and intuition diverge, <span className="text-emerald-400/80">Node #009</span> holds the deciding vote.
                The protocol respects your judgment.
              </p>
            </div>
          </motion.div>
        </div>

        {/* The algorithm vs intuition */}
        <motion.div 
          className="border border-white/10 bg-black p-8 md:p-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-r border-white/10 pr-8">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-5 h-5 text-white/40" />
                <span className="text-white/40 text-sm tracking-[0.15em] uppercase font-mono">
                  Algorithm
                </span>
              </div>
              <p className="text-white/50 font-light leading-relaxed">
                "The data shows 4.4 stars. Tourist noise detected. 
                Adjusting for local weighting... Score validated."
              </p>
            </div>
            <div className="md:pl-8">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-[#d4af37]" />
                <span className="text-[#d4af37]/80 text-sm tracking-[0.15em] uppercase font-mono">
                  Intuition
                </span>
              </div>
              <p className="text-white/70 font-light leading-relaxed">
                "這家店的老闆娘眼神很真誠，菜裡有<span className="text-emerald-400">鍋氣</span>。"
              </p>
              <p className="text-white/40 text-sm font-light mt-2 italic">
                "The owner's eyes are sincere. The food has 'wok breath.'"
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/50 font-light">
              This is the <span className="text-[#d4af37]">"Dark Data"</span> that Buoyancis captures—
            </p>
            <p className="text-white/40 text-sm font-mono mt-2 tracking-wider">
              THE NON-LINEAR SIGNAL NO ML MODEL CAN REPLICATE
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IntuitiveAuditSection;
