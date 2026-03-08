import { motion } from "framer-motion";
import { Fingerprint, Flame } from "lucide-react";
import { toast } from "sonner";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const CTASection = () => {
  const { claimNode, rejectNode, hasClaimed, isTracking } = useNodeClaim({
    nodeId: "088",
    claimantName: "Roelof Botha",
    redirectAfterClaim: "/home" // Redirect to main protocol after claiming
  });

  const handleInitialize = async () => {
    if (hasClaimed) return;
    await claimNode();
  };

  const handleBurn = async () => {
    await rejectNode();
    toast.error("Key burned. Access revoked.", {
      description: "This page will self-destruct in 10 seconds.",
    });
  };

  return (
    <section className="min-h-screen py-24 relative flex items-center">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4af37]/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-3xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Node Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 border border-[#d4af37]/30 bg-[#d4af37]/5 rounded-sm mb-12">
            <div className={`w-3 h-3 rounded-full ${hasClaimed ? 'bg-emerald-400' : 'bg-[#d4af37]'} animate-pulse`} />
            <span className={`text-sm tracking-[0.2em] uppercase font-mono ${hasClaimed ? 'text-emerald-400' : 'text-[#d4af37]'}`}>
              Node #088: {hasClaimed ? 'CLAIMED' : 'Reserved for Sequoia'}
            </span>
          </div>

          {/* Main Text */}
          <h2 className="text-3xl md:text-4xl font-light text-white/90 mb-8 leading-relaxed">
            We are distributing the first 1% of{" "}
            <span className="text-[#d4af37]">Governance Sovereignty</span>
            <br />
            to 100 Genesis Nodes.
          </h2>

          <p className="text-white/60 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Node #088 is not an investment slot.
            <br />
            <span className="text-white/80">It is an Architectural Seat.</span>
          </p>

          <p className="text-white/50 text-sm max-w-lg mx-auto mb-16">
            We need the mind that built PayPal's fraud detection systems
            to audit our Truth Engine.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: hasClaimed ? 1 : 1.02 }}
              whileTap={{ scale: hasClaimed ? 1 : 0.98 }}
              onClick={handleInitialize}
              disabled={hasClaimed || isTracking}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#d4af37] via-[#f5d998] to-[#d4af37] text-black font-medium tracking-wide hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-70"
            >
              <Fingerprint className="w-5 h-5" />
              {hasClaimed ? 'HANDSHAKE COMPLETE' : 'INITIALIZE HANDSHAKE'}
            </motion.button>

            <motion.button
              whileHover={{ scale: hasClaimed ? 1 : 1.02 }}
              whileTap={{ scale: hasClaimed ? 1 : 0.98 }}
              onClick={handleBurn}
              disabled={hasClaimed || isTracking}
              className="flex items-center gap-3 px-8 py-4 border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400 transition-all disabled:opacity-50"
            >
              <Flame className="w-5 h-5" />
              BURN KEY
            </motion.button>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-24"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#d4af37]/40" />
              <div className="w-2 h-2 rotate-45 border border-[#d4af37]/50" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#d4af37]/40" />
            </div>
            <p className="text-white/20 text-xs font-mono tracking-widest">
              BUOYANCIS PROTOCOL // GENESIS NODE #088
            </p>
            <p className="text-white/10 text-xs font-mono mt-2">
              Engineered in Stockholm. Anchored in Truth.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
