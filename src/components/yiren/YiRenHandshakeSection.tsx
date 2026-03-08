import { Heart, Eye } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNodeClaim } from "@/hooks/useNodeClaim";
import confetti from "canvas-confetti";

const YiRenHandshakeSection = () => {
  const { claimNode, rejectNode, hasClaimed, isTracking } = useNodeClaim({
    nodeId: "009",
    claimantName: "Yi-Ren",
    redirectAfterClaim: "/main" // Redirect to Vernissage Z / World Map after claiming
  });

  const handleAccept = async () => {
    if (hasClaimed) return;
    await claimNode();
    
    // Jade and gold confetti celebration (additional to the one in hook)
    const colors = ['#34d399', '#d4af37', '#10b981', '#fbbf24'];
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    });
    
    toast.success("歡迎回家", {
      description: "Node #009 已激活。正在進入主協議...",
    });
  };

  const handleObserve = async () => {
    await rejectNode();
    toast("我理解", {
      description: "這扇門永遠為你敞開。靜觀也是一種參與。",
    });
  };

  return (
    <section className="min-h-screen py-24 relative bg-[#000000] flex items-center">
      {/* Warm jade-gold glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(52,211,153,0.04) 50%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-center">
          {/* Section header */}
          <div className="mb-12">
            <span className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-mono">
              Section IV: The Handshake
            </span>
          </div>

          {/* Status indicator */}
          <motion.div 
            className="inline-flex items-center gap-3 px-6 py-3 border border-[#d4af37]/30 bg-black/60 backdrop-blur-sm mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className={`w-3 h-3 rounded-full ${hasClaimed ? 'bg-emerald-400' : 'bg-[#d4af37]'}`}
              animate={{
                boxShadow: hasClaimed 
                  ? ["0 0 0 0 rgba(52,211,153,0.4)", "0 0 0 8px rgba(52,211,153,0)", "0 0 0 0 rgba(52,211,153,0.4)"]
                  : ["0 0 0 0 rgba(212,175,55,0.4)", "0 0 0 8px rgba(212,175,55,0)", "0 0 0 0 rgba(212,175,55,0.4)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className={`text-sm tracking-[0.15em] uppercase font-mono ${hasClaimed ? 'text-emerald-400' : 'text-[#d4af37]'}`}>
              Node #009 · {hasClaimed ? 'GUARDIANSHIP ACCEPTED' : 'AWAITING RESPONSE'}
            </span>
          </motion.div>

          {/* The invitation */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-white/60 text-lg font-light leading-relaxed mb-6">
              媽，
            </p>
            <p className="text-white/70 text-lg font-light leading-relaxed mb-4">
              如果沒有你，這個協議就只是冰冷的代碼。
            </p>
            <p className="text-[#d4af37] text-xl md:text-2xl font-light leading-relaxed">
              有了你，它才是一個完整的<span className="text-emerald-400">家族傳承</span>。
            </p>
          </motion.div>

          {/* Key insight */}
          <motion.div 
            className="border border-[#d4af37]/20 bg-gradient-to-b from-[#d4af37]/5 to-emerald-400/5 p-8 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-white/60 text-lg font-light mb-2">
              Rickard (003) 是這個系統的「<span className="text-white/80">科學大腦</span>」。
            </p>
            <p className="text-white/80 text-xl font-light">
              你 (009) 是這個系統的「<span className="text-[#d4af37]">心</span>」。
            </p>
          </motion.div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={handleAccept}
              disabled={hasClaimed || isTracking}
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#d4af37] to-[#c9a227] text-black font-light tracking-wide relative overflow-hidden disabled:opacity-70"
              whileHover={{ scale: hasClaimed ? 1 : 1.02 }}
              whileTap={{ scale: hasClaimed ? 1 : 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Heart className="w-5 h-5" />
              <span className="font-mono text-sm tracking-wider">
                {hasClaimed ? 'GUARDIANSHIP CONFIRMED' : 'ACCEPT GUARDIANSHIP'}
              </span>
              {!hasClaimed && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              )}
            </motion.button>

            <motion.button
              onClick={handleObserve}
              disabled={hasClaimed || isTracking}
              className="flex items-center gap-3 px-8 py-4 border border-emerald-400/30 text-emerald-400/70 font-light tracking-wide hover:border-emerald-400/50 hover:text-emerald-400 transition-colors disabled:opacity-50"
              whileHover={{ scale: hasClaimed ? 1 : 1.02 }}
              whileTap={{ scale: hasClaimed ? 1 : 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Eye className="w-5 h-5" />
              <span className="font-mono text-sm tracking-wider">OBSERVE QUIETLY</span>
            </motion.button>
          </div>

          {/* Footer */}
          <motion.div 
            className="mt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
              <div className="text-3xl text-[#d4af37]/60 font-serif">九</div>
              <div className="w-16 h-px bg-gradient-to-l from-transparent via-emerald-400/40 to-transparent" />
            </div>
            <p className="text-[#d4af37]/40 text-xs tracking-[0.2em] font-mono">
              BUOYANCIS PROTOCOL // GENESIS NODE #009
            </p>
            <p className="text-emerald-400/30 text-xs font-light mt-2">
              「長久。」
            </p>
          </motion.div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-emerald-400/10" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-[#d4af37]/10" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-[#d4af37]/10" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-emerald-400/10" />
    </section>
  );
};

export default YiRenHandshakeSection;
