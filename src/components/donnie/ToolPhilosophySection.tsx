import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Lightbulb, TrendingUp, Wrench, Zap } from "lucide-react";

interface Guardian {
  id: string;
  name: string;
  chineseName: string;
  color: string;
  icon: typeof Lightbulb;
  domain: string;
  principle: string;
  toolAlignment: string;
}

const primaryGuardians: Guardian[] = [
  {
    id: "einstein",
    name: "Einstein",
    chineseName: "爱因斯坦",
    color: "#87CEEB",
    icon: Lightbulb,
    domain: "LOGIC",
    principle: "Simplicity is the ultimate sophistication",
    toolAlignment: "Every tool should reduce complexity, not add it. The best code is the code you don't have to write.",
  },
  {
    id: "li-ka-shing",
    name: "Li Ka-shing",
    chineseName: "李嘉誠",
    color: "#FFB347",
    icon: TrendingUp,
    domain: "EFFICIENCY",
    principle: "Time is the only asset you cannot replenish",
    toolAlignment: "A good tool saves hours. A great tool saves months. The right tool changes trajectories.",
  },
];

const ToolPhilosophySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeGuardian, setActiveGuardian] = useState<string | null>(null);

  return (
    <section ref={ref} className="py-32 bg-[#0A0A0A] relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212, 175, 55, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 175, 55, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <Wrench className="w-4 h-4 text-[#D4AF37]/50" />
            <span className="font-mono text-[#D4AF37]/50 text-xs tracking-[0.3em] uppercase">
              Guardian Alignment
            </span>
            <Zap className="w-4 h-4 text-[#D4AF37]/50" />
          </div>
          <h2 className="font-mono text-3xl md:text-4xl text-white mb-4">
            The <span className="text-[#D4AF37]">Philosophy</span> of Tools
          </h2>
          <p className="font-mono text-white/40 text-sm max-w-xl mx-auto">
            Two guardians preside over this node: Logic and Efficiency.
          </p>
        </motion.div>

        {/* Guardian Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {primaryGuardians.map((guardian, index) => (
            <motion.div
              key={guardian.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.15 }}
              onMouseEnter={() => setActiveGuardian(guardian.id)}
              onMouseLeave={() => setActiveGuardian(null)}
              className={`
                relative p-8 rounded-lg border backdrop-blur-xl transition-all duration-500 cursor-pointer
                ${activeGuardian === guardian.id 
                  ? "border-white/20 bg-white/[0.03]" 
                  : "border-white/5 bg-white/[0.01]"}
              `}
              style={{
                boxShadow: activeGuardian === guardian.id 
                  ? `0 0 40px ${guardian.color}20` 
                  : "none",
              }}
            >
              {/* Domain badge */}
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 font-mono text-xs"
                style={{
                  backgroundColor: `${guardian.color}15`,
                  color: guardian.color,
                  border: `1px solid ${guardian.color}30`,
                }}
              >
                <guardian.icon className="w-3 h-3" />
                {guardian.domain}
              </div>

              {/* Guardian header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center font-serif text-xl"
                  style={{
                    backgroundColor: `${guardian.color}15`,
                    color: guardian.color,
                    border: `1px solid ${guardian.color}30`,
                  }}
                >
                  {guardian.chineseName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-mono text-xl text-white">{guardian.name}</h3>
                  <span className="font-mono text-white/30 text-sm">{guardian.chineseName}</span>
                </div>
              </div>

              {/* Principle */}
              <div className="mb-6">
                <span className="font-mono text-[10px] text-white/30 tracking-wider uppercase">
                  Core Principle
                </span>
                <p className="font-mono text-white/70 text-sm italic mt-1">
                  "{guardian.principle}"
                </p>
              </div>

              {/* Tool alignment */}
              <div className="pt-4 border-t border-white/5">
                <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: guardian.color }}>
                  Tool Alignment
                </span>
                <p className="font-mono text-white/50 text-sm leading-relaxed mt-2">
                  {guardian.toolAlignment}
                </p>
              </div>

              {/* Hover glow */}
              {activeGuardian === guardian.id && (
                <motion.div
                  layoutId="guardian-glow"
                  className="absolute inset-0 rounded-lg -z-10"
                  style={{
                    background: `radial-gradient(ellipse at center, ${guardian.color}08 0%, transparent 70%)`,
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Synthesis statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div 
            className="inline-block px-8 py-6 rounded-lg border border-white/5 backdrop-blur-xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)",
            }}
          >
            <p className="font-mono text-white/60 text-sm mb-3">
              Einstein provides the <span className="text-[#87CEEB]">clarity</span>.
              <br />
              Li Ka-shing provides the <span className="text-[#FFB347]">velocity</span>.
            </p>
            <p className="font-mono text-white text-lg">
              Together, they forge the <span className="text-[#D4AF37]">Architect's Mind</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ToolPhilosophySection;
