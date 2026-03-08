import { useState, useEffect, useCallback } from "react";

export interface DecodeHistoryItem {
  word: string;
  timestamp: number;
  tags?: string[];
  isFavorite?: boolean;
}

const STORAGE_KEY = "buoyancis_decode_history";
const TAGS_KEY = "buoyancis_decode_tags";
const MAX_HISTORY_ITEMS = 50;

export function useDecodeHistory() {
  const [history, setHistory] = useState<DecodeHistoryItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load history and tags from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DecodeHistoryItem[];
        setHistory(parsed);
      }
      const storedTags = localStorage.getItem(TAGS_KEY);
      if (storedTags) {
        setAvailableTags(JSON.parse(storedTags));
      }
    } catch (error) {
      console.error("Failed to load decode history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = useCallback((items: DecodeHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save decode history:", error);
    }
  }, []);

  // Save tags to localStorage
  const saveTags = useCallback((tags: string[]) => {
    try {
      localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error("Failed to save tags:", error);
    }
  }, []);

  const addToHistory = useCallback((word: string) => {
    if (!word.trim()) return;
    
    const normalizedWord = word.trim().toUpperCase();
    
    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter(
        (item) => item.word.toUpperCase() !== normalizedWord
      );
      
      // Add new item at the beginning
      const newHistory = [
        { word: word.trim(), timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS);
      
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  const removeFromHistory = useCallback((word: string) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.word.toUpperCase() !== word.toUpperCase()
      );
      saveHistory(filtered);
      return filtered;
    });
  }, [saveHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Add a new tag to available tags
  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) return;
    
    setAvailableTags((prev) => {
      if (prev.includes(normalizedTag)) return prev;
      const newTags = [...prev, normalizedTag].sort();
      saveTags(newTags);
      return newTags;
    });
  }, [saveTags]);

  // Remove a tag from available tags and all history items
  const removeTag = useCallback((tag: string) => {
    const normalizedTag = tag.toLowerCase();
    
    setAvailableTags((prev) => {
      const newTags = prev.filter((t) => t !== normalizedTag);
      saveTags(newTags);
      return newTags;
    });
    
    setHistory((prev) => {
      const updated = prev.map((item) => ({
        ...item,
        tags: item.tags?.filter((t) => t !== normalizedTag),
      }));
      saveHistory(updated);
      return updated;
    });
  }, [saveTags, saveHistory]);

  // Add tag to a specific history item
  const addTagToItem = useCallback((word: string, tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) return;
    
    // Ensure tag exists in available tags
    setAvailableTags((prev) => {
      if (prev.includes(normalizedTag)) return prev;
      const newTags = [...prev, normalizedTag].sort();
      saveTags(newTags);
      return newTags;
    });
    
    setHistory((prev) => {
      const updated = prev.map((item) => {
        if (item.word.toUpperCase() === word.toUpperCase()) {
          const currentTags = item.tags || [];
          if (currentTags.includes(normalizedTag)) return item;
          return { ...item, tags: [...currentTags, normalizedTag] };
        }
        return item;
      });
      saveHistory(updated);
      return updated;
    });
  }, [saveTags, saveHistory]);

  // Remove tag from a specific history item
  const removeTagFromItem = useCallback((word: string, tag: string) => {
    const normalizedTag = tag.toLowerCase();
    
    setHistory((prev) => {
      const updated = prev.map((item) => {
        if (item.word.toUpperCase() === word.toUpperCase()) {
          return {
            ...item,
            tags: item.tags?.filter((t) => t !== normalizedTag),
          };
        }
        return item;
      });
      
      // Check if any other items still use this tag
      const tagStillInUse = updated.some((item) => 
        item.tags?.includes(normalizedTag)
      );
      
      // If no items use the tag anymore, remove it from available tags
      if (!tagStillInUse) {
        setAvailableTags((prevTags) => {
          const newTags = prevTags.filter((t) => t !== normalizedTag);
          saveTags(newTags);
          return newTags;
        });
      }
      
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory, saveTags]);

  // Toggle favorite status for an item
  const toggleFavorite = useCallback((word: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) => {
        if (item.word.toUpperCase() === word.toUpperCase()) {
          return { ...item, isFavorite: !item.isFavorite };
        }
        return item;
      });
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  const importHistory = useCallback((
    items: DecodeHistoryItem[], 
    mode: "skip" | "overwrite" = "skip"
  ): { added: number; skipped: number; overwritten: number } => {
    let added = 0;
    let skipped = 0;
    let overwritten = 0;
    
    setHistory((prev) => {
      const existingWordsMap = new Map(
        prev.map(item => [item.word.toUpperCase(), item])
      );
      const newItems: DecodeHistoryItem[] = [];
      const updatedExisting: DecodeHistoryItem[] = [];
      
      for (const item of items) {
        if (!item.word || typeof item.word !== 'string') {
          skipped++;
          continue;
        }
        
        const normalizedWord = item.word.trim().toUpperCase();
        const existingItem = existingWordsMap.get(normalizedWord);
        
        if (existingItem) {
          if (mode === "overwrite") {
            // Replace existing item with imported version
            updatedExisting.push({
              word: item.word.trim(),
              timestamp: item.timestamp || Date.now(),
              isFavorite: item.isFavorite ?? existingItem.isFavorite ?? false,
              tags: item.tags ?? existingItem.tags,
            });
            existingWordsMap.delete(normalizedWord);
            overwritten++;
          } else {
            skipped++;
          }
          continue;
        }
        
        newItems.push({
          word: item.word.trim(),
          timestamp: item.timestamp || Date.now(),
          isFavorite: item.isFavorite || false,
          tags: item.tags,
        });
        added++;
      }
      
      // Combine: remaining existing items + updated existing + new items
      const remainingExisting = prev.filter(
        item => existingWordsMap.has(item.word.toUpperCase())
      );
      
      const mergedHistory = [...remainingExisting, ...updatedExisting, ...newItems]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_HISTORY_ITEMS);
      
      saveHistory(mergedHistory);
      return mergedHistory;
    });
    
    return { added, skipped, overwritten };
  }, [saveHistory]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    importHistory,
    availableTags,
    addTag,
    removeTag,
    addTagToItem,
    removeTagFromItem,
    toggleFavorite,
  };
}
