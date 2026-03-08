import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const ThesisSection = () => {
  const [chartProgress, setChartProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setChartProgress(prev => (prev >= 100 ? 0 : prev + 0.5));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Exponential curve for AI content
  const getAICurveY = (x: number) => {
    return 180 - (Math.pow(1.05, x * 0.8) - 1) * 2;
  };

  // Flat line for human attention
  const humanAttentionY = 140;

  return (
    <section className="min-h-screen py-24 relative">
      <div className="container max-w-4xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-red-400/60 text-xs tracking-[0.3em] uppercase font-mono">
            The Problem
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-white/90 mt-4">
            The Inflation of Noise
          </h2>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16 border border-white/10 bg-black/50 p-8 md:p-12"
        >
          <svg viewBox="0 0 400 200" className="w-full h-64 md:h-80">
            {/* Grid */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={`h-${i}`}
                x1="40"
                y1={40 + i * 35}
                x2="380"
                y2={40 + i * 35}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4 4"
              />
            ))}
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <line
                key={`v-${i}`}
                x1={40 + i * 57}
                y1="40"
                x2={40 + i * 57}
                y2="180"
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Axes */}
            <line x1="40" y1="180" x2="380" y2="180" stroke="rgba(255,255,255,0.2)" />
            <line x1="40" y1="40" x2="40" y2="180" stroke="rgba(255,255,255,0.2)" />

            {/* Labels */}
            <text x="210" y="198" textAnchor="middle" className="fill-white/30 text-[10px] font-mono">
              Time →
            </text>
            <text x="15" y="110" textAnchor="middle" className="fill-white/30 text-[10px] font-mono" transform="rotate(-90, 15, 110)">
              Volume
            </text>

            {/* Human Attention Line (flat) */}
            <motion.line
              x1="40"
              y1={humanAttentionY}
              x2={40 + chartProgress * 3.4}
              y2={humanAttentionY}
              stroke="#d4af37"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
            />
            <text x="350" y={humanAttentionY - 8} className="fill-[#d4af37]/80 text-[9px] font-mono">
              Human Attention
            </text>

            {/* AI Content Curve (exponential) */}
            <motion.path
              d={`M 40 180 ${Array.from({ length: Math.floor(chartProgress) }, (_, i) => 
                `L ${40 + i * 3.4} ${getAICurveY(i)}`
              ).join(' ')}`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
            />
            {chartProgress > 50 && (
              <text x="300" y="60" className="fill-red-400/80 text-[9px] font-mono">
                AI Content
              </text>
            )}

            {/* Intersection warning */}
            {chartProgress > 70 && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <circle cx="280" cy={humanAttentionY} r="4" fill="#ef4444" className="animate-pulse" />
                <text x="290" y={humanAttentionY + 4} className="fill-red-400 text-[8px] font-mono">
                  OVERFLOW
                </text>
              </motion.g>
            )}
          </svg>
        </motion.div>

        {/* Body Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <p className="text-xl md:text-2xl text-white/80 font-light leading-relaxed">
            Generative AI drives the marginal cost of bullshit to{" "}
            <span className="text-red-400">zero</span>.
          </p>
          
          <p className="text-lg text-white/60 leading-relaxed">
            When content is infinite, <span className="text-[#d4af37]">Trust</span> becomes 
            the only scarce asset.
          </p>

          <div className="border-l-2 border-white/10 pl-6 py-4 space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-red-400/60 font-mono text-sm shrink-0">OLD:</span>
              <p className="text-white/50">
                "Democratic Voting" — <span className="font-mono text-sm">1 Person = 1 Vote</span>
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-[#d4af37]/80 font-mono text-sm shrink-0">NEW:</span>
              <p className="text-white/80">
                "Gravitational Weighting" — <span className="font-mono text-sm text-[#d4af37]">1 Mass = 1 Gravity</span>
              </p>
            </div>
          </div>

          <p className="text-white/40 text-sm font-mono pt-4">
            In an age of infinite bots, democracy is easily hacked.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ThesisSection;
