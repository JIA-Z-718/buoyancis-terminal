import { Building2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const SriramHandshakeSection = () => {
  const { claimNode, rejectNode, hasClaimed, isTracking } = useNodeClaim({
    nodeId: "001",
    claimantName: "Sriram Krishnan",
    redirectAfterClaim: "/home"
  });

  const handleAccept = async () => {
    if (hasClaimed) return;
    await claimNode();
  };

  const handleDefer = async () => {
    await rejectNode();
    toast.error("RESPONSIBILITY DEFERRED", {
      description: "Session archived. The entropy continues.",
    });
  };

  return (
    <section className="min-h-screen py-24 relative bg-[#0a1628] flex items-center">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl" />

      <div className="container max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 border border-cyan-400/30 bg-cyan-400/5 mb-12">
            <div className={`w-3 h-3 rounded-full ${hasClaimed ? 'bg-emerald-400' : 'bg-cyan-400'} animate-pulse`} />
            <span className={`text-sm tracking-[0.2em] uppercase font-light ${hasClaimed ? 'text-emerald-400' : 'text-cyan-400'}`}>
              Node #001 Status: {hasClaimed ? 'CLAIMED' : 'AVAILABLE'}
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-8 tracking-tight">
            Why Node <span className="text-cyan-400">#001</span>?
          </h2>

          {/* Role distinction */}
          <div className="border border-white/10 bg-white/[0.02] p-8 mb-12 text-left max-w-xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-white/40 font-light">Node #000</span>
                <span className="text-white/20">—</span>
                <span className="text-white/60 font-light">Marc</span>
                <span className="text-white/20">—</span>
                <span className="text-white/80 font-light">The Philosophy</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-cyan-400 font-light">Node #001</span>
                <span className="text-white/20">—</span>
                <span className="text-cyan-400/80 font-light">Sriram</span>
                <span className="text-white/20">—</span>
                <span className="text-white font-light">The Architecture</span>
              </div>
            </div>
          </div>

          {/* The ask */}
          <p className="text-white/50 text-lg font-light max-w-xl mx-auto mb-4 leading-relaxed">
            We need the product sense that scaled Twitter,
          </p>
          <p className="text-white/50 text-lg font-light max-w-xl mx-auto mb-4 leading-relaxed">
            combined with the policy insight that guides the White House.
          </p>
          <p className="text-cyan-400 text-xl font-light max-w-xl mx-auto mb-16">
            You are the bridge between Silicon Valley acceleration and Global Stability.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={handleAccept}
              disabled={hasClaimed || isTracking}
              className="group flex items-center gap-3 px-8 py-4 bg-cyan-400 text-[#0a1628] font-light tracking-wide relative overflow-hidden disabled:opacity-70"
              whileHover={{ scale: hasClaimed ? 1 : 1.02 }}
              whileTap={{ scale: hasClaimed ? 1 : 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Building2 className="w-5 h-5" />
              <span>{hasClaimed ? 'ARCHITECT SEAT CLAIMED' : 'ACCEPT ARCHITECT SEAT'}</span>
              {/* Shimmer effect on hover */}
              {!hasClaimed && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              )}
            </motion.button>

            <motion.button
              onClick={handleDefer}
              disabled={hasClaimed || isTracking}
              className="group flex items-center gap-3 px-8 py-4 border border-white/20 text-white/50 font-light tracking-wide hover:border-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
              whileHover={{ scale: hasClaimed ? 1 : 1.02 }}
              whileTap={{ scale: hasClaimed ? 1 : 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <XCircle className="w-5 h-5" />
              <span>DEFER RESPONSIBILITY</span>
            </motion.button>
          </div>

          {/* Footer */}
          <div className="mt-24">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-cyan-400/40" />
              <div className="w-2 h-2 bg-cyan-400" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-cyan-400/40" />
            </div>
            <p className="text-cyan-400/40 text-xs tracking-widest font-light">
              BUOYANCIS PROTOCOL // GENESIS NODE #001
            </p>
            <p className="text-white/20 text-xs font-light mt-2">
              "The architecture of trust defines the architecture of society."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SriramHandshakeSection;
