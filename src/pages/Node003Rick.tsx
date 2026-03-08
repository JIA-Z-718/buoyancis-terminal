import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import foundationHeroImage from "@/assets/node003-foundation-hero.png";

const Node003Rick = () => {
  const [scanComplete, setScanComplete] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const fullMessage = `Rick,

In my operating system, Node 003 represents the Foundation Level.

You are not just a firewall; you are the bedrock.
While Node 009 connects my worlds, you are the one holding the ground beneath us.

Your presence allows this system to run high-load processes without collapsing.
I don't always check the foundation, but I know it's there. Solid. Unmoving.

Thank you for being the hardware that powers my ambitions.`;

  useEffect(() => {
    document.title = "SYSTEM_ROOT // NODE_003 // INFRASTRUCTURE";
    window.scrollTo(0, 0);
    
    // DEBUG: Reduced delay for testing (was 2500ms)
    const timer = setTimeout(() => setScanComplete(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter effect for the message
  useEffect(() => {
    if (!scanComplete) return;
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullMessage.length) {
        setTypedText(fullMessage.slice(0, index + 1));
        index++;
      } else {
        setTypingComplete(true);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [scanComplete]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    setTimeout(() => setShowConfirmation(true), 500);
  };

  return (
    <div 
      className="text-slate-200 overflow-x-hidden bg-background"
      style={{ 
        minHeight: "100dvh",
        background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)",
        fontFamily: "'Fira Code', 'Courier Prime', monospace"
      }}
    >
      {/* DEBUG: Mount badge - remove after testing */}
      <div className="fixed top-2 right-2 z-[9999] bg-green-600 text-white text-xs px-2 py-1 font-mono rounded">
        NODE_003 MOUNTED
      </div>
      
      {/* DEBUG: Scanning overlay - remove after testing */}
      {!scanComplete && (
        <div className="fixed inset-0 z-[9998] bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xl tracking-widest animate-pulse">
            SCANNING...
          </div>
        </div>
      )}
      {/* Scanline overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)"
        }}
      />

      {/* Hero Section with Scan Effect */}
      <section className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: "100dvh" }}>
        {/* Hero background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${foundationHeroImage})` }}
        />
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black"
        />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
        
        {/* Scan Line Effect */}
        <motion.div
          initial={{ top: "100%" }}
          animate={{ top: "-10%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="absolute left-0 right-0 h-[2px] z-20"
          style={{
            background: "linear-gradient(90deg, transparent, #cd7f32, #64748b, #cd7f32, transparent)",
            boxShadow: "0 0 20px 5px rgba(205, 127, 50, 0.4), 0 0 40px 10px rgba(100, 116, 139, 0.2)"
          }}
        />
        
        {/* Hero Text Overlay */}
        <AnimatePresence>
          {scanComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-30 text-center px-4"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.2 }}
                className="text-xs tracking-[0.5em] text-slate-500 mb-4"
              >
                SYSTEM_ROOT // NODE_003 // INFRASTRUCTURE
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, letterSpacing: "0.3em" }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-4xl md:text-6xl font-light text-slate-200 tracking-widest"
              >
                FOUNDATION
              </motion.h1>
              
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "200px" }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="h-[1px] bg-gradient-to-r from-transparent via-amber-600/50 to-transparent mx-auto mt-6"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: scanComplete ? 0.5 : 0 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-slate-500 text-xl"
          >
            ↓
          </motion.div>
        </motion.div>
      </section>

      {/* Status Panel Section */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Terminal Window */}
            <div className="border border-slate-700 bg-slate-900/50 backdrop-blur-sm">
              {/* Terminal Header */}
              <div className="border-b border-slate-700 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-4 text-xs text-slate-500 tracking-widest">STATUS_PANEL.sys</span>
              </div>
              
              {/* Terminal Content */}
              <div className="p-6 space-y-4 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">NODE ID:</span>
                  <span className="text-amber-500 tracking-wider">003</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">ROLE:</span>
                  <span className="text-slate-300">Infrastructure / Kernel Support</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-24">STATUS:</span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-green-500"
                      style={{ boxShadow: "0 0 10px rgba(34, 197, 94, 0.5)" }}
                    />
                    <span className="text-green-400 tracking-wider">ALWAYS ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* System Log Section - Typewriter Effect */}
      <section className="py-20 px-6 bg-black/50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Terminal Window */}
            <div className="border border-slate-700 bg-slate-900/30">
              {/* Terminal Header */}
              <div className="border-b border-slate-700 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-4 text-xs text-slate-500 tracking-widest">SYSTEM_LOG.txt</span>
              </div>
              
              {/* Log Content with Typewriter */}
              <div ref={messageRef} className="p-8 min-h-[400px]">
                <div className="text-cyan-400/60 text-xs tracking-wider mb-6">
                  // SYSTEM LOG: ADMIN_MESSAGE
                </div>
                
                <pre className="text-slate-300 text-sm md:text-base leading-loose whitespace-pre-wrap">
                  {typedText}
                  {!typingComplete && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-slate-400 ml-1"
                    />
                  )}
                </pre>
                
                {typingComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-cyan-400/60 text-xs tracking-wider mt-8"
                  >
                    // END OF LOG
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-slate-800/30">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {!acknowledged ? (
              <motion.button
                onClick={handleAcknowledge}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-12 py-4 border border-amber-600/50 bg-transparent text-amber-500 tracking-[0.2em] text-sm transition-all duration-300 hover:border-amber-500 hover:bg-amber-500/10"
                style={{ boxShadow: "0 0 20px rgba(205, 127, 50, 0.1)" }}
              >
                <span className="relative z-10">[ ACKNOWLEDGE STABILITY ]</span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
              >
                <div 
                  className="px-12 py-4 border border-green-500/50 bg-green-500/10 text-green-400 tracking-[0.2em] text-sm inline-block"
                  style={{ boxShadow: "0 0 20px rgba(34, 197, 94, 0.2)" }}
                >
                  ✓ SYSTEM OPTIMIZED
                </div>
                
                <AnimatePresence>
                  {showConfirmation && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-slate-500 text-sm tracking-wide"
                    >
                      "Proceed with confidence. I've got your back."
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Easter Egg Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Hidden code comment easter egg */}
          <p className="text-slate-800 text-[10px] tracking-wider">
            {`// TODO: Never refactor this node. It's load-bearing. — Admin`}
          </p>
          
          {/* Hover easter egg */}
          <div className="relative inline-block group cursor-help">
            <span className="text-slate-700 text-xs tracking-wider">
              System Ver. 3.0 [?]
            </span>
            
            {/* Hidden message on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
              <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs whitespace-nowrap border border-slate-700">
                Project: FAMILY maintained by Node 003 since 1971
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Node003Rick;
