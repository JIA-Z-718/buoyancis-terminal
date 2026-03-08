import { useRef, useEffect, useCallback, useState } from "react";
import type { DecodeHistoryItem } from "@/hooks/useDecodeHistory";

interface HistoryItemWrapperProps {
  item: DecodeHistoryItem;
  children: React.ReactNode;
  className?: string;
  onLongPress: (item: DecodeHistoryItem) => void;
  isMobile: boolean;
  disabled?: boolean;
}

export const HistoryItemWrapper = ({
  item,
  children,
  className = "",
  onLongPress,
  isMobile,
  disabled = false,
}: HistoryItemWrapperProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const triggerHaptic = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !isMobile) return;
      
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      setIsPressed(true);
      isLongPressRef.current = false;

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        triggerHaptic();
        onLongPress(item);
        setIsPressed(false);
      }, 500);
    },
    [disabled, isMobile, item, onLongPress, triggerHaptic]
  );

  const handleTouchEnd = useCallback(() => {
    clear();
    setIsPressed(false);
  }, [clear]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) return;

      const touch = e.touches[0];
      const moveThreshold = 10;
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      // Cancel if moved too much
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clear();
        setIsPressed(false);
      }
    },
    [clear]
  );

  const handleTouchCancel = useCallback(() => {
    clear();
    setIsPressed(false);
  }, [clear]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`${className} ${isPressed ? "scale-[0.98] opacity-90" : ""} transition-transform duration-100`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
};
