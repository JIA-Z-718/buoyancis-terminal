import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Dna, Shield, ArrowRight, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const RickardHandshakeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isJoining, setIsJoining] = useState(false);

  const { claimNode, rejectNode, hasClaimed } = useNodeClaim({
    nodeId: "003",
    claimantName: "Rickard Öste",
    redirectAfterClaim: "/main"
  });

  const handleJoin = async () => {
    if (hasClaimed) return;
    setIsJoining(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.info("Genetic sequence recognized", {
      description: "Scientific Integrity Board initialized.",
    });
    
    await claimNode();
    
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.info("Welcome to the resistance, Rickard.", {
      description: "Node #003 is now active.",
    });
    
    setIsJoining(false);
  };

  const handleStay = async () => {
    await rejectNode();
    toast.info("Session paused", {
      description: "The lab door remains open.",
    });
    window.history.back();
  };

  return (
    <section ref={ref} className="py-32 bg-black relative min-h-screen flex items-center overflow-hidden">
      {/* Warm gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-transparent to-transparent" />
      
      {/* DNA helix pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            style={{ top: `${20 + i * 12}%` }}
            animate={{
              x: ['-100%', '100%'],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-6 relative z-10 w-full">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-12"
        >
          <span className="text-amber-400/50 text-sm tracking-widest uppercase">
            The Invitation
          </span>
          <h2 className="text-3xl md:text-4xl text-white mt-4 font-light">
            Chairman of <span className="text-amber-400">Scientific Integrity</span>
          </h2>
        </motion.div>

        {/* Role Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-950/30 to-black border border-amber-500/30 rounded-2xl p-8 mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Node #003</h3>
              <p className="text-amber-400/60 text-sm">The Anchor of Our Moral Compass</p>
            </div>
          </div>

          <div className="space-y-4 text-white/70 leading-relaxed">
            <p>
              I don't just need your capital (though it helps build the lab).
            </p>
            <p className="text-amber-300 text-lg">
              I need your <span className="font-medium">Stubbornness</span>.
            </p>
            <p>
              I need the person who stood up to the <span className="text-white/90">Swedish Dairy Lobby</span> to 
              teach me how to stand up to <span className="text-white/90">Silicon Valley AI Giants</span>.
            </p>
            <p className="text-amber-400/80 italic">
              Node #003 is the anchor of our moral compass.
            </p>
          </div>

          {/* What This Means */}
          <div className="mt-8 pt-6 border-t border-amber-500/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl text-amber-400 font-light mb-1">Not</div>
                <div className="text-xs text-white/40">Just an Investor</div>
              </div>
              <div className="border-x border-amber-500/20">
                <div className="text-2xl text-amber-400 font-light mb-1">But</div>
                <div className="text-xs text-white/40">A Co-Conspirator</div>
              </div>
              <div>
                <div className="text-2xl text-amber-400 font-light mb-1">In</div>
                <div className="text-xs text-white/40">The Same War</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={handleJoin}
            disabled={isJoining || hasClaimed}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black px-8 py-6 rounded-xl text-base font-medium transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] border-0"
          >
            {isJoining ? (
              <motion.div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Dna className="w-4 h-4" />
                </motion.div>
                <span>SEQUENCING...</span>
              </motion.div>
            ) : hasClaimed ? (
              <span className="flex items-center gap-2">
                <Dna className="w-4 h-4" />
                NODE CLAIMED
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Dna className="w-4 h-4" />
                JOIN THE RESISTANCE
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          <Button
            onClick={handleStay}
            variant="outline"
            disabled={hasClaimed}
            className="border-amber-500/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/5 px-8 py-6 rounded-xl text-base transition-all duration-300"
          >
            <Coffee className="w-4 h-4 mr-2" />
            STAY RETIRED
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="text-amber-500/30 text-xs">
            NODE #003 // SCIENTIFIC INTEGRITY // GENERATIONAL TRANSFER
          </div>
          <div className="text-amber-500/20 text-xs mt-2">
            genesis.buoyancis.com/node-003
          </div>
          <div className="text-amber-500/10 text-xs mt-4 italic">
            "Two generations. One mission. Zero compromise."
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RickardHandshakeSection;
