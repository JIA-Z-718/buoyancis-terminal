import { motion } from "framer-motion";
import { Shield, Zap, Globe } from "lucide-react";

const VerificationLayerSection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-[#0a1628]">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1d35]/50 to-[#0a1628]" />

      <div className="container max-w-5xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <div className="mb-20">
          <span className="text-cyan-400/60 text-xs tracking-[0.3em] uppercase font-light">
            Protocol Architecture
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mt-4 tracking-tight">
            Engineering the <span className="text-cyan-400">Verification Layer</span>
          </h2>
        </div>

        {/* Main Statement */}
        <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 md:p-12 mb-16">
          <p className="text-white/80 text-xl md:text-2xl font-light leading-relaxed">
            Buoyancis is not a content platform.
          </p>
          <p className="text-cyan-400 text-2xl md:text-3xl font-light mt-4">
            It is a Filter for Reality.
          </p>
        </div>

        {/* Trust Latency Concept */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-px bg-gradient-to-r from-cyan-400 to-transparent" />
            <h3 className="text-white/60 text-sm tracking-[0.2em] uppercase font-light">
              Core Innovation
            </h3>
          </div>
          
          <p className="text-white text-xl md:text-2xl font-light mb-4">
            We introduce <span className="text-cyan-400">"Trust Latency"</span>:
          </p>
          <p className="text-white/50 text-lg font-light max-w-2xl">
            In our protocol, information does not travel at the speed of light.
            <br />
            It travels at the speed of <span className="text-white">Verification</span>.
          </p>
        </div>

        {/* Two-column comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Unverified Noise */}
          <motion.div 
            className="border border-red-500/20 bg-red-500/5 p-8 group hover:border-red-500/40 transition-all duration-300"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 border border-red-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-light text-lg">Unverified Noise</p>
                <p className="text-white/30 text-xs tracking-wider uppercase">Dampened</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm font-light">Reach</span>
                <span className="text-red-400 font-mono text-sm">ZERO</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm font-light">Amplification</span>
                <span className="text-red-400 font-mono text-sm">BLOCKED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm font-light">Lifetime</span>
                <span className="text-red-400 font-mono text-sm">IMMEDIATE DECAY</span>
              </div>
            </div>
          </motion.div>

          {/* Verified Signal */}
          <motion.div 
            className="border border-cyan-400/20 bg-cyan-400/5 p-8 group hover:border-cyan-400/40 transition-all duration-300"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 border border-cyan-400/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-cyan-400 font-light text-lg">Verified Signal</p>
                <p className="text-white/30 text-xs tracking-wider uppercase">Amplified</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm font-light">Reach</span>
                <span className="text-cyan-400 font-mono text-sm">GLOBAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm font-light">Amplification</span>
                <span className="text-cyan-400 font-mono text-sm">GRAVITATIONAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm font-light">Lifetime</span>
                <span className="text-cyan-400 font-mono text-sm">PERSISTENT</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Visual Flow */}
        <div className="mt-16 flex items-center justify-center">
          <div className="flex items-center gap-4 text-white/30 text-sm font-light">
            <span>INPUT</span>
            <div className="w-8 h-px bg-white/20" />
            <div className="px-4 py-2 border border-cyan-400/30 text-cyan-400 text-xs tracking-wider">
              VERIFICATION LAYER
            </div>
            <div className="w-8 h-px bg-white/20" />
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>OUTPUT</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerificationLayerSection;
