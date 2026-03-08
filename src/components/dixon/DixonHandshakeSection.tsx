import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Hexagon, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const DixonHandshakeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isInitializing, setIsInitializing] = useState(false);

  const { claimNode, rejectNode, hasClaimed } = useNodeClaim({
    nodeId: "002",
    claimantName: "Dixon",
    redirectAfterClaim: "/home"
  });

  const handleInitialize = async () => {
    if (hasClaimed) return;
    setIsInitializing(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.info("Network effects analysis complete", {
      description: "Critical mass trajectory: T-minus 18 months.",
    });
    
    await claimNode();
    
    setIsInitializing(false);
  };

  const handleRemain = async () => {
    await rejectNode();
    toast.info("Session archived", {
      description: "Node #002 remains in standby mode.",
    });
    window.history.back();
  };

  return (
    <section ref={ref} className="py-32 bg-black relative min-h-screen flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-violet-950/30 via-transparent to-transparent" />
      
      {/* Floating Hexagons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            <Hexagon className="w-16 h-16 text-violet-500/10" />
          </motion.div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-6 relative z-10 w-full">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-12"
        >
          <span className="text-violet-400/50 text-sm tracking-widest uppercase">
            Protocol Handshake
          </span>
          <h2 className="text-3xl md:text-4xl text-white mt-4 font-light">
            Why <span className="text-violet-400">Node #002</span>?
          </h2>
        </motion.div>

        {/* Context Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-violet-950/40 to-purple-950/20 border border-violet-500/30 rounded-2xl p-8 mb-12"
        >
          {/* Node Map */}
          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div className="py-4 border border-white/5 rounded-lg bg-black/30">
              <div className="text-xs text-white/40 mb-1">NODE #000</div>
              <div className="text-violet-400/60 font-medium">Marc</div>
              <div className="text-xs text-white/30 mt-1">Philosophy</div>
            </div>
            <div className="py-4 border border-white/5 rounded-lg bg-black/30">
              <div className="text-xs text-white/40 mb-1">NODE #001</div>
              <div className="text-violet-400/60 font-medium">Sriram</div>
              <div className="text-xs text-white/30 mt-1">Product</div>
            </div>
            <div className="py-4 border border-violet-500/30 rounded-lg bg-violet-500/10">
              <div className="text-xs text-violet-400 mb-1">NODE #002</div>
              <div className="text-violet-300 font-medium">You</div>
              <div className="text-xs text-violet-400/60 mt-1">Network Effects</div>
            </div>
          </div>

          <p className="text-white/70 text-center leading-relaxed">
            Marc (000) sees the <span className="text-white">Philosophy</span>. 
            Sriram (001) sees the <span className="text-white">Product</span>. 
            We need You (002) to see the <span className="text-violet-400">Network Effects</span>.
          </p>
          
          <p className="text-violet-300/60 text-center mt-4 text-sm">
            We are looking for the architect who knows how to bootstrap a network 
            from zero to critical mass without compromising on decentralization.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={handleInitialize}
            disabled={isInitializing || hasClaimed}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-6 rounded-xl text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] border-0"
          >
            {isInitializing ? (
              <motion.div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Hexagon className="w-4 h-4" />
                </motion.div>
                <span>INITIALIZING...</span>
              </motion.div>
            ) : hasClaimed ? (
              <span className="flex items-center gap-2">
                <Hexagon className="w-4 h-4" />
                NODE CLAIMED
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Hexagon className="w-4 h-4" />
                INITIALIZE PROTOCOL (Claim Node)
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          <Button
            onClick={handleRemain}
            variant="outline"
            disabled={hasClaimed}
            className="border-violet-500/30 text-violet-400 hover:text-violet-300 hover:border-violet-500/50 hover:bg-violet-500/5 px-8 py-6 rounded-xl text-base transition-all duration-300"
          >
            <X className="w-4 h-4 mr-2" />
            REMAIN IN WEB2
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="text-violet-500/30 text-xs">
            NODE #002 // PROTOCOL ARCHITECTURE // NETWORK EFFECTS
          </div>
          <div className="text-violet-500/20 text-xs mt-2">
            genesis.buoyancis.com/node-002
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DixonHandshakeSection;
