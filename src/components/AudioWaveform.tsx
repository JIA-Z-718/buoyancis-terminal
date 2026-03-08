import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface AudioWaveformProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

const AudioWaveform = ({
  analyserNode,
  isPlaying,
  barCount = 16,
  className = "",
}: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const draw = useCallback(() => {
    if (!canvasRef.current || !analyserNode || !isPlaying) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize data array if needed
    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);
    }

    // Get frequency data
    analyserNode.getByteFrequencyData(dataArrayRef.current);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate bar dimensions
    const barWidth = canvas.width / barCount;
    const barGap = 2;
    const actualBarWidth = barWidth - barGap;
    const binSize = Math.floor(dataArrayRef.current.length / barCount);

    // Draw bars
    for (let i = 0; i < barCount; i++) {
      // Average the frequency bins for this bar
      let sum = 0;
      for (let j = 0; j < binSize; j++) {
        sum += dataArrayRef.current[i * binSize + j];
      }
      const average = sum / binSize;

      // Calculate bar height (normalize to canvas height)
      const barHeight = Math.max(2, (average / 255) * canvas.height * 0.9);

      // Create gradient for bar
      const gradient = ctx.createLinearGradient(
        i * barWidth,
        canvas.height - barHeight,
        i * barWidth,
        canvas.height
      );
      
      // Use CSS variable colors via computed style
      const computedStyle = getComputedStyle(canvas);
      const primaryColor = computedStyle.getPropertyValue("--primary").trim() || "217 91% 60%";
      const accentColor = computedStyle.getPropertyValue("--accent").trim() || "217 91% 70%";
      
      gradient.addColorStop(0, `hsla(${primaryColor}, 0.9)`);
      gradient.addColorStop(1, `hsla(${accentColor}, 0.5)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(
        i * barWidth + barGap / 2,
        canvas.height - barHeight,
        actualBarWidth,
        barHeight,
        2
      );
      ctx.fill();
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(draw);
  }, [analyserNode, isPlaying, barCount]);

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && analyserNode) {
      draw();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Clear canvas when stopped
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, analyserNode, draw]);

  // Idle animation when not playing
  if (!isPlaying) {
    return (
      <div className={`flex items-end justify-center gap-0.5 h-6 ${className}`}>
        {Array.from({ length: barCount }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-muted-foreground/30 rounded-sm"
            initial={{ height: 2 }}
            animate={{ height: 2 }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.canvas
      ref={canvasRef}
      width={barCount * 8}
      height={24}
      className={`${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    />
  );
};

export default AudioWaveform;
