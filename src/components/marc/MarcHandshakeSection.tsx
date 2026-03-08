import { Terminal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const MarcHandshakeSection = () => {
  const { claimNode, rejectNode, hasClaimed, isTracking } = useNodeClaim({
    nodeId: "000",
    claimantName: "Marc Andreessen",
    redirectAfterClaim: "/home"
  });

  const handleInitialize = async () => {
    if (hasClaimed) return;
    await claimNode();
  };

  const handleIgnore = async () => {
    await rejectNode();
    toast.error("ENTROPY IGNORED", {
      description: "The void remains. Session terminated.",
    });
  };

  return (
    <section className="min-h-screen py-24 relative bg-[#000000] flex items-center">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="container max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 border border-[#d4af37]/40 bg-[#d4af37]/5 mb-12">
            <div className={`w-3 h-3 rounded-full ${hasClaimed ? 'bg-emerald-400' : 'bg-[#d4af37]'} animate-pulse`} />
            <span className={`text-sm tracking-[0.2em] uppercase font-mono ${hasClaimed ? 'text-emerald-400' : 'text-[#d4af37]'}`}>
              Node #000 Status: {hasClaimed ? 'CLAIMED' : 'AVAILABLE'}
            </span>
          </div>

          {/* Main Text */}
          <h2 className="text-3xl md:text-4xl font-mono font-bold text-white mb-8">
            The Origin Node
          </h2>

          <p className="text-white/60 font-mono text-lg max-w-xl mx-auto mb-4 leading-relaxed">
            Node #000 is reserved for the one who started the first epoch,
          </p>
          <p className="text-[#d4af37] font-mono text-lg max-w-xl mx-auto mb-16">
            to help define the next.
          </p>

          {/* Terminal-style info box */}
          <div className="border border-emerald-500/30 bg-black p-6 mb-12 text-left font-mono text-sm max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-emerald-400/60 mb-4">
              <Terminal className="w-4 h-4" />
              <span>node_status.sh</span>
            </div>
            <div className="space-y-1 text-emerald-400/80">
              <p>$ NODE_ID="000"</p>
              <p>$ NODE_TYPE="ORIGIN"</p>
              <p>$ GOVERNANCE_WEIGHT="ARCHITECT_CLASS"</p>
              <p>$ STATUS="<span className={hasClaimed ? 'text-emerald-400' : 'text-[#d4af37]'}>{hasClaimed ? 'CLAIMED' : 'AWAITING_HANDSHAKE'}</span>"</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleInitialize}
              disabled={hasClaimed || isTracking}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-black font-mono font-bold tracking-wide hover:bg-emerald-400 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Terminal className="w-5 h-5" />
              {hasClaimed ? 'SEQUENCE COMPLETE' : 'INITIALIZE SEQUENCE'}
            </button>

            <button
              onClick={handleIgnore}
              disabled={hasClaimed || isTracking}
              className="flex items-center gap-3 px-8 py-4 border border-white/20 text-white/50 font-mono hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              IGNORE ENTROPY
            </button>
          </div>

          {/* Footer */}
          <div className="mt-24">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-emerald-500/40" />
              <div className="w-2 h-2 bg-emerald-400" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-emerald-500/40" />
            </div>
            <p className="text-emerald-400/40 text-xs font-mono tracking-widest">
              BUOYANCIS PROTOCOL // GENESIS NODE #000
            </p>
            <p className="text-white/20 text-xs font-mono mt-2">
              "Software ate the world. Now we eat the entropy."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarcHandshakeSection;
