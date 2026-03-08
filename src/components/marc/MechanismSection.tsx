import { X, Check, Zap } from "lucide-react";

const MechanismSection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-[#000000]">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,197,94,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <div className="mb-16">
          <span className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-mono">
            Core Architecture
          </span>
          <h2 className="text-3xl md:text-4xl font-mono font-bold text-white mt-4">
            Meritocracy as a <span className="text-emerald-400">Protocol</span>
          </h2>
        </div>

        {/* Principles Grid */}
        <div className="space-y-6">
          {/* NO Democracy */}
          <div className="border border-red-500/30 bg-red-500/5 p-6 md:p-8 flex items-start gap-6">
            <div className="w-12 h-12 border border-red-500/40 flex items-center justify-center shrink-0">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-red-400 font-mono text-lg mb-2 flex items-center gap-3">
                <span className="text-white/40">NO</span> Democracy
              </h3>
              <p className="text-white/60 font-mono text-sm">
                One person is <span className="text-red-400 line-through">NOT</span> one vote.
              </p>
              <p className="text-white/40 font-mono text-xs mt-2">
                // Quantity ≠ Quality. Mass determines gravitational pull.
              </p>
            </div>
          </div>

          {/* NO Equity */}
          <div className="border border-red-500/30 bg-red-500/5 p-6 md:p-8 flex items-start gap-6">
            <div className="w-12 h-12 border border-red-500/40 flex items-center justify-center shrink-0">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-red-400 font-mono text-lg mb-2 flex items-center gap-3">
                <span className="text-white/40">NO</span> Equity
              </h3>
              <p className="text-white/60 font-mono text-sm">
                Truth is not distributed equally; it is <span className="text-[#d4af37]">earned</span>.
              </p>
              <p className="text-white/40 font-mono text-xs mt-2">
                // Historical proof-of-work creates asymmetric credibility.
              </p>
            </div>
          </div>

          {/* YES Gravity */}
          <div className="border border-emerald-500/30 bg-emerald-500/5 p-6 md:p-8 flex items-start gap-6">
            <div className="w-12 h-12 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-emerald-400 font-mono text-lg mb-2 flex items-center gap-3">
                <span className="text-white/80">YES</span> Gravity
              </h3>
              <p className="text-white/80 font-mono text-sm">
                Signal strength is proportional to <span className="text-[#d4af37]">historical proof-of-work</span>.
              </p>
              <p className="text-emerald-400/60 font-mono text-xs mt-2">
                // F = G × M₁ × M₂ / r² — Newton's law, applied to reputation.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Metaphor */}
        <div className="mt-16 border border-[#d4af37]/20 bg-[#d4af37]/5 p-8 text-center">
          <Zap className="w-8 h-8 text-[#d4af37] mx-auto mb-4" />
          <p className="text-white/80 font-mono text-lg">
            Build things → Gain Mass → Curve Spacetime → <span className="text-[#d4af37]">Define Reality</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default MechanismSection;
