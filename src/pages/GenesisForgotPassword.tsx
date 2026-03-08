import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

const GenesisForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message.toUpperCase());
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      toast({
        title: "RESET INITIATED",
        description: "Check your inbox for the recovery link.",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-mono overflow-hidden">
      {/* Scanline overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)"
        }}
      />
      
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }}
      />

      {/* Error Overlay */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.9)" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.02, 1],
                opacity: 1,
                x: [0, -5, 5, -3, 3, 0]
              }}
              transition={{ duration: 0.3 }}
              className="text-center px-4"
            >
              <div 
                className="text-red-500 text-2xl md:text-4xl tracking-[0.2em] relative"
                style={{
                  fontFamily: "'Fira Code', monospace",
                  textShadow: "0 0 10px rgba(255,0,0,0.8), 0 0 20px rgba(255,0,0,0.4)"
                }}
              >
                RESET FAILED
              </div>
              <div className="text-red-400/60 text-xs md:text-sm mt-4 tracking-wider">
                {errorMessage}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Terminal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 px-4 w-full max-w-md"
      >
        {/* System Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 text-xs tracking-[0.5em] mb-8 text-center"
          style={{ fontFamily: "'Fira Code', monospace" }}
        >
          GENESIS_SYSTEM v1.0 // RECOVERY
        </motion.div>

        {/* Terminal Box */}
        <div 
          className="border border-slate-700 p-8 relative"
          style={{ 
            background: "rgba(0,0,0,0.5)",
            boxShadow: "0 0 40px rgba(100,100,100,0.05), inset 0 0 20px rgba(0,0,0,0.5)"
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-slate-500" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-slate-500" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-slate-500" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-slate-500" />

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <div 
                className="text-green-400 text-lg tracking-[0.2em] mb-2"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                RESET LINK SENT
              </div>
              <div 
                className="text-slate-500 text-xs tracking-wider"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                Check your email for instructions
              </div>
            </motion.div>
          ) : (
            <>
              <div 
                className="text-slate-400 text-lg tracking-[0.2em] mb-2 text-center"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                CREDENTIAL RECOVERY
              </div>
              <div 
                className="text-slate-600 text-xs tracking-[0.15em] mb-8 text-center"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                Enter your identity to receive reset link
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label 
                    className="text-slate-500 text-xs tracking-[0.2em] block mb-2"
                    style={{ fontFamily: "'Fira Code', monospace" }}
                  >
                    IDENTITY
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@genesis.system"
                    required
                    className="w-full bg-transparent border border-slate-700 text-slate-300 px-4 py-3 tracking-wider text-sm outline-none focus:border-slate-500 transition-colors placeholder:text-slate-700"
                    style={{ fontFamily: "'Fira Code', monospace" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full border border-slate-600 text-slate-400 py-3 tracking-[0.2em] text-sm hover:border-slate-400 hover:text-slate-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Fira Code', monospace" }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    "[ INITIATE RECOVERY ]"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Link 
            to="/genesis/login" 
            className="text-slate-500 text-xs tracking-wider hover:text-slate-300 transition-colors"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            ← RETURN TO LOGIN
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GenesisForgotPassword;
