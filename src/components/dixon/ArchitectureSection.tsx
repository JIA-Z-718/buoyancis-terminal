import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Box, Layers, Wifi } from "lucide-react";

const ArchitectureSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const layers = [
    {
      level: "Layer 1",
      title: "The Asset",
      description: "Real Estate, Services, Code, Content",
      icon: Box,
      color: "violet",
    },
    {
      level: "Layer 2",
      title: "The Buoyancis Protocol",
      description: "Gravitational Filtering & Verification",
      icon: Layers,
      color: "purple",
    },
    {
      level: "Layer 3",
      title: "The Signal",
      description: "Consumed by Wallets, AI Agents, & Humans",
      icon: Wifi,
      color: "fuchsia",
    },
  ];

  return (
    <section ref={ref} className="py-32 bg-black relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-violet-950/20 via-transparent to-transparent" />
      
      {/* Crystalline Structure Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <svg className="w-full h-full" viewBox="0 0 800 600">
          <defs>
            <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Geometric lines */}
          {[...Array(12)].map((_, i) => (
            <motion.line
              key={i}
              x1={100 + (i * 50)}
              y1={50}
              x2={400}
              y2={300}
              stroke="url(#crystalGrad)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 0.3 } : {}}
              transition={{ delay: i * 0.1, duration: 1.5 }}
            />
          ))}
          {[...Array(12)].map((_, i) => (
            <motion.line
              key={`b-${i}`}
              x1={700 - (i * 50)}
              y1={550}
              x2={400}
              y2={300}
              stroke="url(#crystalGrad)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 0.3 } : {}}
              transition={{ delay: 0.5 + i * 0.1, duration: 1.5 }}
            />
          ))}
        </svg>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-16"
        >
          <span className="text-violet-400/50 text-sm tracking-widest uppercase">
            Protocol Architecture
          </span>
          <h2 className="text-3xl md:text-4xl text-white mt-4 font-light">
            Sovereign Nodes, <span className="text-violet-400">Shared Gravity</span>
          </h2>
        </motion.div>

        {/* Layer Stack */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="relative max-w-2xl mx-auto"
        >
          {layers.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <motion.div
                key={layer.level}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.2 }}
                className={`relative mb-4 last:mb-0`}
              >
                <div className={`
                  bg-gradient-to-r from-${layer.color}-950/50 to-transparent
                  border border-${layer.color}-500/30
                  rounded-xl p-6 
                  hover:border-${layer.color}-500/50 transition-all duration-300
                  hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]
                `}
                style={{
                  background: `linear-gradient(90deg, rgba(139, 92, 246, ${0.1 + i * 0.05}) 0%, transparent 100%)`,
                  borderColor: `rgba(139, 92, 246, ${0.2 + i * 0.1})`,
                }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-violet-400/60 font-mono">{layer.level}</span>
                        <span className="text-white font-medium">{layer.title}</span>
                      </div>
                      <p className="text-white/50 text-sm">{layer.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Connector */}
                {i < layers.length - 1 && (
                  <div className="absolute left-10 -bottom-4 w-px h-4 bg-gradient-to-b from-violet-500/30 to-transparent" />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Composability Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center max-w-2xl mx-auto"
        >
          <div className="bg-violet-950/30 border border-violet-500/20 rounded-2xl p-8">
            <p className="text-white/70 leading-relaxed mb-4">
              We are not building a walled garden. We are building the 
              <span className="text-violet-400"> Hyperstructure</span> for credibility.
            </p>
            <p className="text-white/70 leading-relaxed mb-4">
              This protocol is designed to be <span className="text-violet-400">composable</span>.
            </p>
            <p className="text-violet-300 font-medium">
              Your wallet doesn't just hold your money; it holds your Truth Score.
            </p>
          </div>
        </motion.div>

        {/* Technical Specs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="mt-12 grid grid-cols-3 gap-4 text-center"
        >
          <div className="py-4">
            <div className="text-2xl text-violet-400 font-light mb-1">On-chain</div>
            <div className="text-xs text-white/40">Reputation</div>
          </div>
          <div className="py-4 border-x border-violet-500/20">
            <div className="text-2xl text-violet-400 font-light mb-1">Permissionless</div>
            <div className="text-xs text-white/40">Access</div>
          </div>
          <div className="py-4">
            <div className="text-2xl text-violet-400 font-light mb-1">Composable</div>
            <div className="text-xs text-white/40">Integration</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
