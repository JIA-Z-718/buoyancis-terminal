import { motion } from "framer-motion";
import { MapPin, CheckCircle, Users, TrendingUp } from "lucide-react";

const LocalTruthSection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-[#0a1628]">
      <div className="container max-w-5xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <div className="mb-16">
          <span className="text-cyan-400/60 text-xs tracking-[0.3em] uppercase font-light">
            Case Study
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mt-4 tracking-tight">
            Proof of Mechanism: <span className="text-cyan-400">The "Local Truth" Test</span>
          </h2>
        </div>

        {/* Map Visualization */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Map mockup */}
          <div className="relative aspect-square max-w-md mx-auto w-full">
            {/* Base map grid */}
            <div 
              className="absolute inset-0 border border-white/10 bg-[#0d1d35]/50"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />
            
            {/* Stockholm highlight zone */}
            <motion.div
              className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border border-cyan-400/40 bg-cyan-400/10"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(34,211,238,0.2)',
                  '0 0 40px rgba(34,211,238,0.3)',
                  '0 0 20px rgba(34,211,238,0.2)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Node points */}
            {[
              { top: '40%', left: '42%', size: 12, delay: 0 },
              { top: '35%', left: '50%', size: 8, delay: 0.2 },
              { top: '48%', left: '38%', size: 10, delay: 0.4 },
              { top: '45%', left: '55%', size: 6, delay: 0.6 },
              { top: '52%', left: '48%', size: 8, delay: 0.8 },
            ].map((node, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-cyan-400"
                style={{ 
                  top: node.top, 
                  left: node.left, 
                  width: node.size, 
                  height: node.size,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + node.delay, duration: 0.3 }}
              />
            ))}

            {/* Location label */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400/80 text-xs tracking-wider uppercase font-light">
                Stockholm, Sweden
              </span>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span className="text-white/40 text-xs">High-Integrity Node</span>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-8">
            <div>
              <p className="text-white/40 text-sm tracking-wider uppercase font-light mb-2">Target</p>
              <p className="text-white text-xl font-light">Stockholm Hospitality Sector</p>
            </div>

            <div className="border-l-2 border-cyan-400/30 pl-6 space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white/60 text-sm font-light">Identification Accuracy</p>
                  <p className="text-cyan-400 text-2xl font-light">99.4%</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Users className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white/60 text-sm font-light">Classification</p>
                  <p className="text-white font-light">"High-Integrity Nodes" vs "Tourist Noise"</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <TrendingUp className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white/60 text-sm font-light">Signal Isolation</p>
                  <p className="text-white font-light">Complete separation achieved</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Implication Statement */}
        <div className="border border-white/10 bg-white/[0.02] p-8 md:p-12">
          <p className="text-white/40 text-sm tracking-wider uppercase font-light mb-4">
            Strategic Implication
          </p>
          <p className="text-white/80 text-xl md:text-2xl font-light leading-relaxed">
            If we can verify a <span className="text-cyan-400">restaurant</span>,
          </p>
          <p className="text-white/80 text-xl md:text-2xl font-light leading-relaxed">
            we can verify a <span className="text-cyan-400">news source</span>.
          </p>
          <p className="text-white text-xl md:text-2xl font-light leading-relaxed mt-2">
            We can verify a <span className="text-cyan-400">policy</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LocalTruthSection;
