import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { DecodeHistoryItem } from "./useDecodeHistory";

const MAX_HISTORY_ITEMS = 50;

export function useCloudDecodeHistory() {
  const { user } = useAuth();
  const [cloudHistory, setCloudHistory] = useState<DecodeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Fetch history from cloud
  const fetchCloudHistory = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("decode_history")
        .select("*")
        .eq("user_id", user.id)
        .order("decoded_at", { ascending: false })
        .limit(MAX_HISTORY_ITEMS);

      if (error) throw error;

      const items: DecodeHistoryItem[] = (data || []).map((row) => ({
        word: row.word,
        timestamp: new Date(row.decoded_at).getTime(),
        tags: row.tags || [],
        isFavorite: row.is_favorite || false,
      }));

      setCloudHistory(items);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Failed to fetch cloud history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Add word to cloud history
  const addToCloud = useCallback(
    async (word: string) => {
      if (!user || !word.trim()) return;

      try {
        const { error } = await supabase.from("decode_history").upsert(
          {
            user_id: user.id,
            word: word.trim(),
            decoded_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,word",
          }
        );

        if (error) throw error;

        // Update local state
        setCloudHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.word.toUpperCase() !== word.trim().toUpperCase()
          );
          return [
            { word: word.trim(), timestamp: Date.now(), tags: [] },
            ...filtered,
          ].slice(0, MAX_HISTORY_ITEMS);
        });
      } catch (error) {
        console.error("Failed to add to cloud history:", error);
      }
    },
    [user]
  );

  // Remove word from cloud history
  const removeFromCloud = useCallback(
    async (word: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("decode_history")
          .delete()
          .eq("user_id", user.id)
          .ilike("word", word);

        if (error) throw error;

        setCloudHistory((prev) =>
          prev.filter(
            (item) => item.word.toUpperCase() !== word.toUpperCase()
          )
        );
      } catch (error) {
        console.error("Failed to remove from cloud history:", error);
      }
    },
    [user]
  );

  // Clear all cloud history
  const clearCloud = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("decode_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setCloudHistory([]);
    } catch (error) {
      console.error("Failed to clear cloud history:", error);
    }
  }, [user]);

  // Add tag to cloud item
  const addTagToCloudItem = useCallback(
    async (word: string, tag: string) => {
      if (!user) return;

      const normalizedTag = tag.trim().toLowerCase();
      if (!normalizedTag) return;

      try {
        // Get current tags
        const { data: existingData } = await supabase
          .from("decode_history")
          .select("tags")
          .eq("user_id", user.id)
          .ilike("word", word)
          .single();

        const currentTags = existingData?.tags || [];
        if (currentTags.includes(normalizedTag)) return;

        const { error } = await supabase
          .from("decode_history")
          .update({ tags: [...currentTags, normalizedTag] })
          .eq("user_id", user.id)
          .ilike("word", word);

        if (error) throw error;

        setCloudHistory((prev) =>
          prev.map((item) =>
            item.word.toUpperCase() === word.toUpperCase()
              ? { ...item, tags: [...(item.tags || []), normalizedTag] }
              : item
          )
        );
      } catch (error) {
        console.error("Failed to add tag to cloud item:", error);
      }
    },
    [user]
  );

  // Remove tag from cloud item
  const removeTagFromCloudItem = useCallback(
    async (word: string, tag: string) => {
      if (!user) return;

      const normalizedTag = tag.toLowerCase();

      try {
        const { data: existingData } = await supabase
          .from("decode_history")
          .select("tags")
          .eq("user_id", user.id)
          .ilike("word", word)
          .single();

        const currentTags = existingData?.tags || [];
        const newTags = currentTags.filter((t: string) => t !== normalizedTag);

        const { error } = await supabase
          .from("decode_history")
          .update({ tags: newTags })
          .eq("user_id", user.id)
          .ilike("word", word);

        if (error) throw error;

        setCloudHistory((prev) =>
          prev.map((item) =>
            item.word.toUpperCase() === word.toUpperCase()
              ? { ...item, tags: item.tags?.filter((t) => t !== normalizedTag) }
              : item
          )
        );
      } catch (error) {
        console.error("Failed to remove tag from cloud item:", error);
      }
    },
    [user]
  );

  // Toggle favorite status in cloud
  const toggleCloudFavorite = useCallback(
    async (word: string) => {
      if (!user) return;

      try {
        // Get current favorite status
        const { data: existingData } = await supabase
          .from("decode_history")
          .select("is_favorite")
          .eq("user_id", user.id)
          .ilike("word", word)
          .single();

        const newFavoriteStatus = !(existingData?.is_favorite || false);

        const { error } = await supabase
          .from("decode_history")
          .update({ is_favorite: newFavoriteStatus })
          .eq("user_id", user.id)
          .ilike("word", word);

        if (error) throw error;

        setCloudHistory((prev) =>
          prev.map((item) =>
            item.word.toUpperCase() === word.toUpperCase()
              ? { ...item, isFavorite: newFavoriteStatus }
              : item
          )
        );
      } catch (error) {
        console.error("Failed to toggle favorite in cloud:", error);
      }
    },
    [user]
  );

  // Sync local history to cloud
  const syncLocalToCloud = useCallback(
    async (localHistory: DecodeHistoryItem[]) => {
      if (!user || localHistory.length === 0) return;

      setIsSyncing(true);
      try {
        const records = localHistory.map((item) => ({
          user_id: user.id,
          word: item.word,
          decoded_at: new Date(item.timestamp).toISOString(),
          tags: item.tags || [],
          is_favorite: item.isFavorite || false,
        }));

        const { error } = await supabase
          .from("decode_history")
          .upsert(records, { onConflict: "user_id,word" });

        if (error) throw error;

        await fetchCloudHistory();
      } catch (error) {
        console.error("Failed to sync local to cloud:", error);
      } finally {
        setIsSyncing(false);
      }
    },
    [user, fetchCloudHistory]
  );

  // Fetch on mount and user change
  useEffect(() => {
    if (user) {
      fetchCloudHistory();
    } else {
      setCloudHistory([]);
    }
  }, [user, fetchCloudHistory]);

  return {
    cloudHistory,
    isLoading,
    isSyncing,
    lastSyncTime,
    addToCloud,
    removeFromCloud,
    clearCloud,
    addTagToCloudItem,
    removeTagFromCloudItem,
    toggleCloudFavorite,
    syncLocalToCloud,
    refreshCloud: fetchCloudHistory,
  };
}
