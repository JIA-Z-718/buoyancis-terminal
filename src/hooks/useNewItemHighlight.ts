import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to track newly added items and trigger highlight animations.
 * Items are considered "new" for a configurable duration after being added.
 */
export function useNewItemHighlight<T extends { id: string }>(
  items: T[],
  options: {
    /** How long an item stays highlighted (ms). Default: 3000 */
    highlightDuration?: number;
    /** Whether to track new items. Default: true */
    enabled?: boolean;
  } = {}
) {
  const { highlightDuration = 3000, enabled = true } = options;
  
  // Track IDs of items that should be highlighted
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  
  // Keep track of known IDs to detect new additions
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!enabled) return;
    
    const currentIds = new Set(items.map((item) => item.id));
    
    // Skip highlighting on initial load
    if (!isInitializedRef.current) {
      knownIdsRef.current = currentIds;
      isInitializedRef.current = true;
      return;
    }
    
    // Find new items (IDs that weren't in our known set)
    const newIds: string[] = [];
    currentIds.forEach((id) => {
      if (!knownIdsRef.current.has(id)) {
        newIds.push(id);
      }
    });
    
    if (newIds.length > 0) {
      // Add new IDs to highlighted set
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });
      
      // Remove highlight after duration
      const timeoutId = setTimeout(() => {
        setHighlightedIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, highlightDuration);
      
      // Update known IDs
      knownIdsRef.current = currentIds;
      
      return () => clearTimeout(timeoutId);
    }
    
    // Also update known IDs when items are removed
    knownIdsRef.current = currentIds;
  }, [items, highlightDuration, enabled]);
  
  const isHighlighted = useCallback(
    (id: string) => highlightedIds.has(id),
    [highlightedIds]
  );
  
  const clearHighlights = useCallback(() => {
    setHighlightedIds(new Set());
  }, []);
  
  return {
    /** Check if an item should be highlighted */
    isHighlighted,
    /** Set of currently highlighted item IDs */
    highlightedIds,
    /** Clear all highlights manually */
    clearHighlights,
  };
}
