import { useState, useEffect, useRef } from "react";

interface UseAnimatedCounterOptions {
  duration?: number;
  easing?: (t: number) => number;
  significantChangeThreshold?: number; // Percentage threshold for significant change
}

interface UseAnimatedCounterResult {
  displayValue: number;
  changeDirection: "up" | "down" | null;
  changeAmount: number | null;
  isAnimating: boolean;
  isSignificantChange: boolean;
}

// Easing function for smooth animation
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export function useAnimatedCounter(
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
): UseAnimatedCounterResult {
  const { duration = 500, easing = easeOutExpo, significantChangeThreshold = 20 } = options;
  const [displayValue, setDisplayValue] = useState(targetValue);
  const [changeDirection, setChangeDirection] = useState<"up" | "down" | null>(null);
  const [changeAmount, setChangeAmount] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSignificantChange, setIsSignificantChange] = useState(false);
  const previousValueRef = useRef(targetValue);
  const animationRef = useRef<number | null>(null);
  const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const significantTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = targetValue;
    
    // Skip animation if values are the same
    if (startValue === endValue) {
      return;
    }

    // Set change direction and amount
    const direction = endValue > startValue ? "up" : "down";
    const amount = endValue - startValue;
    setChangeDirection(direction);
    setChangeAmount(amount);
    setIsAnimating(true);

    // Check if change is significant (>threshold% increase or absolute increase of 5+)
    const percentageChange = startValue > 0 
      ? ((endValue - startValue) / startValue) * 100 
      : endValue > 0 ? 100 : 0;
    const absoluteChange = endValue - startValue;
    const isSignificant = direction === "up" && (percentageChange >= significantChangeThreshold || absoluteChange >= 5);
    
    setIsSignificantChange(isSignificant);

    // Clear previous timeouts
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    if (significantTimeoutRef.current) {
      clearTimeout(significantTimeoutRef.current);
    }

    // Hide indicator after animation + delay
    changeTimeoutRef.current = setTimeout(() => {
      setChangeDirection(null);
      setChangeAmount(null);
    }, duration + 1500);

    // Hide significant pulse after animation
    significantTimeoutRef.current = setTimeout(() => {
      setIsSignificantChange(false);
    }, duration + 800);

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      
      const currentValue = Math.round(
        startValue + (endValue - startValue) * easedProgress
      );
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = endValue;
        setIsAnimating(false);
      }
    };

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, easing, significantChangeThreshold]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
      if (significantTimeoutRef.current) {
        clearTimeout(significantTimeoutRef.current);
      }
    };
  }, []);

  return { displayValue, changeDirection, changeAmount, isAnimating, isSignificantChange };
}
