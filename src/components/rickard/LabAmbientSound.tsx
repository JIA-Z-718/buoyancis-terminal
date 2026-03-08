import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LabAmbientSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Hide hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const generateAndPlayAmbient = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lab-ambient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.audioContent) {
        throw new Error(data.error || "Failed to generate audio");
      }

      // Create audio from base64
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = 0.15; // Subtle volume
      audioRef.current = audio;
      
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to generate lab ambient:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const toggleSound = useCallback(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      generateAndPlayAmbient();
    }
  }, [isPlaying, generateAndPlayAmbient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Hint text */}
      <AnimatePresence>
        {showHint && !isPlaying && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="bg-amber-950/80 backdrop-blur-sm border border-amber-500/20 rounded-lg px-3 py-1.5"
          >
            <span className="text-amber-400/70 text-xs">Lab Ambient</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound toggle button */}
      <motion.button
        onClick={toggleSound}
        disabled={isLoading}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          backdrop-blur-sm border transition-all duration-300
          ${isPlaying 
            ? "bg-amber-500/20 border-amber-400/40 text-amber-400" 
            : "bg-black/50 border-amber-500/20 text-amber-400/50 hover:border-amber-400/40 hover:text-amber-400"
          }
          ${isLoading ? "animate-pulse" : ""}
          ${hasError ? "border-red-500/40 text-red-400/50" : ""}
        `}
        title={isPlaying ? "Mute lab ambient" : "Play lab ambient sound"}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full"
          />
        ) : isPlaying ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </motion.button>

      {/* Playing indicator */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-1 -right-1 w-3 h-3"
          >
            <span className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-40" />
            <span className="absolute inset-0 bg-amber-400 rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabAmbientSound;
