import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const TheoreticalModelSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const codeLines = [
    { text: "calculate_truth(Signal, Observers) ->", indent: 0 },
    { text: "TotalMass = sum([Node#node.mass || Node <- Observers]),", indent: 1 },
    { text: "WeightedSignal = sum([Node#node.mass * Node#node.vote || Node <- Observers]),", indent: 1 },
    { text: "case TotalMass > CriticalThreshold of", indent: 1 },
    { text: "true -> {ok, collapse_wave_function(WeightedSignal)};", indent: 2 },
    { text: "false -> {error, noise_entropy_too_high}", indent: 2 },
    { text: "end.", indent: 1 },
  ];

  return (
    <section ref={ref} className="py-32 bg-black relative">
      {/* Subtle Grid */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
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
            // SECTION 02
          </span>
          <h2 className="font-mono text-2xl md:text-3xl text-white mt-2">
            Proposal: <span className="text-green-400">Gravitational Consistency</span>
          </h2>
        </motion.div>

        {/* Code Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-zinc-950 border border-green-500/20 rounded-none overflow-hidden mb-12"
        >
          {/* Terminal Header */}
          <div className="bg-zinc-900 px-4 py-2 flex items-center gap-2 border-b border-green-500/20">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-4 font-mono text-xs text-green-500/50">consensus.erl</span>
          </div>
          
          {/* Code Content */}
          <div className="p-6 overflow-x-auto">
            <pre className="font-mono text-sm md:text-base">
              {codeLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="leading-relaxed"
                  style={{ paddingLeft: `${line.indent * 24}px` }}
                >
                  <span className="text-green-500/30 mr-4 select-none">{String(i + 1).padStart(2, '0')}</span>
                  <span className={
                    line.text.includes('->') ? 'text-green-400' :
                    line.text.includes('{ok') ? 'text-green-300' :
                    line.text.includes('{error') ? 'text-red-400' :
                    'text-white/80'
                  }>
                    {line.text}
                  </span>
                </motion.div>
              ))}
            </pre>
          </div>
        </motion.div>

        {/* Theory Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="space-y-6 font-mono text-white/70"
        >
          <p className="leading-relaxed">
            We introduce a variable <span className="text-green-400 bg-green-500/10 px-2 py-0.5">G</span> (Gravity) to the consensus algorithm.
          </p>
          
          <p className="leading-relaxed">
            The probability of a signal being "True" is a function of the <span className="text-green-400">Historical Integrity Mass</span> of the observer chain.
          </p>

          {/* Formula */}
          <div className="bg-zinc-950 border border-green-500/20 p-6 mt-8">
            <div className="text-center">
              <span className="text-green-500/50 text-xs block mb-4">// CORE FORMULA</span>
              <div className="text-xl md:text-2xl text-green-400">
                P(Truth) = Σ(Mᵢ × Vᵢ) / Σ(Mᵢ)
              </div>
              <div className="text-sm text-white/40 mt-4">
                where M = Historical Integrity Mass, V = Vote
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vector Field Visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="mt-16 border border-green-500/20 p-8 relative overflow-hidden"
        >
          <div className="absolute top-4 left-4 font-mono text-xs text-green-500/50">
            // VECTOR FIELD SIMULATION
          </div>
          
          {/* Chaos to Order Visualization */}
          <div className="h-48 flex items-center justify-between">
            {/* Chaotic Side */}
            <div className="w-1/3 h-full relative">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`chaos-${i}`}
                  className="absolute w-px bg-green-500/30"
                  style={{
                    height: `${20 + Math.random() * 30}%`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 70}%`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                  animate={{
                    rotate: [0, 360],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                  }}
                />
              ))}
              <div className="absolute bottom-0 left-0 right-0 text-center font-mono text-xs text-red-400/60">
                ENTROPY
              </div>
            </div>

            {/* Gravity Point */}
            <div className="w-1/3 flex items-center justify-center">
              <motion.div
                className="w-16 h-16 rounded-full border-2 border-green-500/50 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(34, 197, 94, 0.2)',
                    '0 0 40px rgba(34, 197, 94, 0.4)',
                    '0 0 20px rgba(34, 197, 94, 0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="font-mono text-green-400 text-sm">G</span>
              </motion.div>
            </div>

            {/* Ordered Side */}
            <div className="w-1/3 h-full relative flex flex-col justify-center gap-2">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`order-${i}`}
                  className="h-px bg-green-500/50 w-full"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={isInView ? { scaleX: 1, opacity: 0.5 } : {}}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  style={{ originX: 0 }}
                />
              ))}
              <div className="absolute bottom-0 left-0 right-0 text-center font-mono text-xs text-green-400/60">
                CONSENSUS
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TheoreticalModelSection;
