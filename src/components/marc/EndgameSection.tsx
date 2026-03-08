const EndgameSection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-[#000000]">
      <div className="container max-w-4xl mx-auto px-6">
        {/* Heading */}
        <div className="mb-16">
          <span className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-mono">
            Strategic Position
          </span>
          <h2 className="text-3xl md:text-4xl font-mono font-bold text-white mt-4">
            The Standard of <span className="text-emerald-400">Reality</span>
          </h2>
        </div>

        {/* Main Thesis */}
        <div className="border border-white/10 bg-black/50 p-8 md:p-12 mb-12">
          <p className="text-white/80 font-mono text-xl leading-relaxed mb-8">
            We are pricing the sovereignty of the{" "}
            <span className="text-[#d4af37]">"Truth Standard"</span> at{" "}
            <span className="text-white text-2xl">€3B</span>.
          </p>
          
          <div className="border-t border-white/10 pt-8">
            <p className="text-emerald-400 font-mono text-lg">
              This is the TCP/IP for credibility.
            </p>
            <p className="text-white/40 font-mono text-sm mt-4">
              // The protocol layer that makes trust machine-readable.
            </p>
          </div>
        </div>

        {/* Protocol Stack Visualization */}
        <div className="space-y-2 mb-16">
          <div className="border border-white/10 bg-white/5 p-4 font-mono text-sm">
            <span className="text-white/40">Layer 5:</span>{" "}
            <span className="text-white/80">Applications (AI Agents, Autonomous Systems)</span>
          </div>
          <div className="border border-white/10 bg-white/5 p-4 font-mono text-sm">
            <span className="text-white/40">Layer 4:</span>{" "}
            <span className="text-white/80">Services (Verification APIs, Trust Queries)</span>
          </div>
          <div className="border border-[#d4af37]/40 bg-[#d4af37]/10 p-4 font-mono text-sm">
            <span className="text-[#d4af37]">Layer 3:</span>{" "}
            <span className="text-[#d4af37]">BUOYANCIS PROTOCOL (Truth Layer)</span>
            <span className="text-emerald-400 ml-4">← YOU ARE HERE</span>
          </div>
          <div className="border border-white/10 bg-white/5 p-4 font-mono text-sm">
            <span className="text-white/40">Layer 2:</span>{" "}
            <span className="text-white/80">Transport (HTTP/3, WebRTC)</span>
          </div>
          <div className="border border-white/10 bg-white/5 p-4 font-mono text-sm">
            <span className="text-white/40">Layer 1:</span>{" "}
            <span className="text-white/80">Network (TCP/IP)</span>
          </div>
        </div>

        {/* The Ask */}
        <div className="text-center border-t border-white/10 pt-12">
          <p className="text-white/60 font-mono text-lg mb-4">
            We are looking for the
          </p>
          <p className="text-3xl md:text-4xl font-mono">
            <span className="text-[#d4af37]">Architects</span>
            <span className="text-white/40">,</span>
          </p>
          <p className="text-white/60 font-mono text-lg mt-4">
            not just the allocators.
          </p>
        </div>
      </div>
    </section>
  );
};

export default EndgameSection;
