import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Hammer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const ArchitectHandshake = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isBuilding, setIsBuilding] = useState(false);

  const { claimNode, rejectNode, hasClaimed } = useNodeClaim({
    nodeId: "011",
    claimantName: "Donnie SC Lygonis",
    redirectAfterClaim: "/main",
  });

  const handleBuild = async () => {
    if (hasClaimed) return;
    setIsBuilding(true);

    toast.info("Initializing build sequence...", { duration: 800 });
    await new Promise((resolve) => setTimeout(resolve, 800));

    toast.info("Compiling tool synergy...", { duration: 800 });
    await new Promise((resolve) => setTimeout(resolve, 800));

    await claimNode();

    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Construction complete.", {
      description: "The Architect's node is active.",
    });

    setIsBuilding(false);
  };

  const handleDecline = async () => {
    await rejectNode();
    toast.error("Build cancelled.", {
      description: "The blueprint remains unexecuted.",
    });
    window.history.back();
  };

  return (
    <section
      ref={ref}
      className="py-32 bg-[#0A0A0A] relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Blueprint grid background */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(100, 180, 255, 0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 180, 255, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-3xl mx-auto px-6 relative z-10 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-12"
        >
          <span className="font-mono text-[#D4AF37]/50 text-xs tracking-[0.3em] uppercase">
            // FINAL EXECUTION
          </span>
          <h2 className="font-mono text-3xl md:text-4xl text-white mt-4">
            Complete the <span className="text-[#D4AF37]">Build</span>
          </h2>
        </motion.div>

        {/* Terminal Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-white/10 backdrop-blur-xl overflow-hidden mb-12"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          }}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/30">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 font-mono text-xs text-white/30">
              node_011_architect.sh
            </span>
          </div>

          {/* Terminal content */}
          <div className="p-8 font-mono text-sm space-y-4">
            <div className="text-green-500/70">
              $ initialize --node=011 --type=architect
            </div>
            <div className="text-white/50 pl-4">
              → Loading tool configurations...
            </div>
            <div className="text-[#64B4FF]/70 pl-4">
              ✓ Lovable integration: ACTIVE
            </div>
            <div className="text-[#64B4FF]/70 pl-4">
              ✓ Gemini synergy: ACTIVE
            </div>
            <div className="text-[#D4AF37]/70 pl-4">
              ✓ Guardian alignment: Einstein + Li Ka-shing
            </div>
            <div className="text-white/30 pl-4">
              ...
            </div>
            <div className="text-white/70">
              Ready for deployment. Awaiting confirmation.
            </div>
            <motion.div
              className="inline-block"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-[#D4AF37]">█</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center mb-12"
        >
          <blockquote className="font-serif text-2xl md:text-3xl text-white italic mb-3">
            "Construction over Consolation."
          </blockquote>
          <span className="font-mono text-[#D4AF37]/60 text-lg">
            建設重於慰藉
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={handleBuild}
            disabled={isBuilding || hasClaimed}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-black px-10 py-7 rounded-none font-mono text-sm tracking-wider transition-all duration-300 hover:shadow-[0_0_60px_rgba(212,175,55,0.3)] border-0"
          >
            {isBuilding ? (
              <motion.span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Hammer className="w-4 h-4" />
                </motion.div>
                BUILDING...
              </motion.span>
            ) : hasClaimed ? (
              <span className="flex items-center gap-2">
                <Hammer className="w-4 h-4" />
                NODE CONSTRUCTED
              </span>
            ) : (
              <span className="flex items-center gap-2">
                DEPLOY NODE
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          <Button
            onClick={handleDecline}
            variant="outline"
            disabled={hasClaimed}
            className="border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 hover:bg-white/[0.02] px-10 py-7 rounded-none font-mono text-sm tracking-wider transition-all duration-300"
          >
            CANCEL BUILD
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center space-y-2"
        >
          <div className="font-mono text-[#D4AF37]/20 text-xs tracking-wider">
            NODE #011 // ARCHITECT OF TOOLS
          </div>
          <div className="font-mono text-white/10 text-xs">
            genesis.buoyancis.com/node-011
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ArchitectHandshake;
