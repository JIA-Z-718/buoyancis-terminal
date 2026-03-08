import { useCallback, useRef, useState } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  onPress?: () => void;
  onCancel?: () => void;
  delay?: number;
  hapticFeedback?: boolean;
}

interface UseLongPressResult {
  isPressed: boolean;
  isLongPressed: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchCancel: () => void;
  };
}

export function useLongPress({
  onLongPress,
  onPress,
  onCancel,
  delay = 500,
  hapticFeedback = true,
}: UseLongPressOptions): UseLongPressResult {
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [hapticFeedback]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      setIsPressed(true);
      isLongPressRef.current = false;

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setIsLongPressed(true);
        triggerHaptic();
        onLongPress();
      }, delay);
    },
    [delay, onLongPress, triggerHaptic]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clear();
      setIsPressed(false);
      setIsLongPressed(false);

      if (!isLongPressRef.current && onPress) {
        onPress();
      }
    },
    [clear, onPress]
  );

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
        setIsLongPressed(false);
        onCancel?.();
      }
    },
    [clear, onCancel]
  );

  const handleTouchCancel = useCallback(() => {
    clear();
    setIsPressed(false);
    setIsLongPressed(false);
    onCancel?.();
  }, [clear, onCancel]);

  return {
    isPressed,
    isLongPressed,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchCancel: handleTouchCancel,
    },
  };
}
