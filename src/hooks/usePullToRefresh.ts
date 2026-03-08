import { useState, useRef, useCallback, useEffect, RefObject } from "react";

interface PullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
}

export function usePullToRefresh(
  containerRef: RefObject<HTMLElement>,
  options: PullToRefreshOptions
) {
  const { onRefresh, threshold = 80, maxPull = 120, disabled = false } = options;
  
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    canRefresh: false,
  });
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isAtTop = useRef(true);

  const checkIfAtTop = useCallback(() => {
    if (!containerRef.current) return true;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    return scrollTop <= 0;
  }, [containerRef]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    
    isAtTop.current = checkIfAtTop();
    if (!isAtTop.current) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  }, [disabled, state.isRefreshing, checkIfAtTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing || !isAtTop.current) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only trigger pull-to-refresh when pulling down
    if (diff > 0 && checkIfAtTop()) {
      // Apply resistance to make it feel natural
      const resistance = 0.4;
      const pullDistance = Math.min(diff * resistance, maxPull);
      
      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh: pullDistance >= threshold,
      }));
      
      // Prevent default scrolling when pulling
      if (pullDistance > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, state.isRefreshing, threshold, maxPull, checkIfAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !state.isPulling) return;
    
    if (state.canRefresh) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        pullDistance: threshold * 0.6,
      }));
      
      try {
        await onRefresh();
      } finally {
        // Small delay for visual feedback
        setTimeout(() => {
          setState({
            isPulling: false,
            pullDistance: 0,
            isRefreshing: false,
            canRefresh: false,
          });
        }, 300);
      }
    } else {
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
        canRefresh: false,
      });
    }
  }, [disabled, state.isPulling, state.canRefresh, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false to allow preventDefault
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return state;
}
