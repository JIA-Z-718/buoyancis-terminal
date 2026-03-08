import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FlaskConical, Dices, Clock, Beaker } from "lucide-react";

const ScienceSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 bg-gradient-to-b from-black via-amber-950/5 to-black relative">
      {/* Laboratory grid pattern - represents scientific rigor */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-16"
        >
          <span className="text-amber-400/50 text-sm tracking-widest uppercase">
            The Method
          </span>
          <h2 className="text-3xl md:text-4xl text-white mt-4 font-light">
            Built in a <span className="text-white">Lab</span>, Not a <span className="text-red-400/60">Casino</span>.
          </h2>
        </motion.div>

        {/* Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-8 mb-16"
        >
          {/* Casino Approach */}
          <div className="bg-red-950/10 border border-red-500/20 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Dices className="w-6 h-6 text-red-400/60" />
                </div>
                <div>
                  <h3 className="text-red-400/80 font-medium">Most Crypto/Tech Founders</h3>
                  <p className="text-red-400/40 text-sm">Building Casinos</p>
                </div>
              </div>
              <ul className="space-y-3 text-white/50 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400/50 mt-0.5">×</span>
                  <span>Quick exits over lasting value</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400/50 mt-0.5">×</span>
                  <span>Hype cycles and pump-and-dump</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400/50 mt-0.5">×</span>
                  <span>Building for the exit, not the mission</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Lab Approach */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-amber-400 font-medium">Our Approach</h3>
                  <p className="text-amber-400/50 text-sm">Building a Protocol</p>
                </div>
              </div>
              <ul className="space-y-3 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Years of research, not weeks of hype</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Protocol perfection over quick profits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Building for generations, not quarters</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Personal Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="bg-black/50 border border-amber-500/20 rounded-2xl p-8"
        >
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Beaker className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <p className="text-white/80 leading-relaxed mb-4">
                Just like you spent <span className="text-amber-400">decades in the lab at Lund University</span> perfecting 
                the enzymatic process, I am spending my nights perfecting the consensus algorithm.
              </p>
              <p className="text-amber-300/80 leading-relaxed font-light italic text-lg">
                This is not about hype. It is about <span className="text-amber-400 font-medium">Nutrition for the Digital Age</span>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Timeline Parallel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-12 flex justify-center"
        >
          <div className="inline-flex items-center gap-8 text-center">
            <div>
              <Clock className="w-5 h-5 text-amber-400/50 mx-auto mb-2" />
              <div className="text-2xl text-amber-400 font-light">30</div>
              <div className="text-xs text-white/40">Years at Lund</div>
            </div>
            <div className="text-amber-500/30 text-2xl">=</div>
            <div>
              <Clock className="w-5 h-5 text-amber-300/50 mx-auto mb-2" />
              <div className="text-2xl text-amber-300 font-light">∞</div>
              <div className="text-xs text-white/40">Nights of Code</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ScienceSection;
