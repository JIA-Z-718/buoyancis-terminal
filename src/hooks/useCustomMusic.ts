import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomMusic {
  id: string;
  name: string;
  url: string;
  isLocal?: boolean;
  isPublic?: boolean;
  isOwner?: boolean;
}

interface CustomMusicRow {
  id: string;
  name: string;
  file_path: string;
  is_public: boolean;
  user_id: string;
}

const STORAGE_KEY = "custom-music-list";

export function useCustomMusic() {
  const [customMusic, setCustomMusic] = useState<CustomMusic[]>([]);
  const [publicMusic, setPublicMusic] = useState<CustomMusic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load custom music from localStorage and database
  useEffect(() => {
    const loadMusic = async () => {
      setIsLoading(true);
      const myMusicList: CustomMusic[] = [];
      const publicMusicList: CustomMusic[] = [];

      // Load from localStorage (for non-logged-in users)
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const localMusic = JSON.parse(stored) as CustomMusic[];
          myMusicList.push(...localMusic.map(m => ({ ...m, isLocal: true, isOwner: true })));
        }
      } catch (e) {
        console.error("Failed to load local music:", e);
      }

      // Load from database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Load all accessible music (own + public)
        const { data, error } = await supabase
          .from("custom_music" as any)
          .select("id, name, file_path, is_public, user_id")
          .order("created_at", { ascending: false });

        if (!error && data) {
          (data as unknown as CustomMusicRow[]).forEach(item => {
            const { data: urlData } = supabase.storage
              .from("audio")
              .getPublicUrl(item.file_path);
            
            const isOwner = user?.id === item.user_id;
            const musicItem: CustomMusic = {
              id: item.id,
              name: item.name,
              url: urlData.publicUrl,
              isPublic: item.is_public,
              isOwner,
            };

            if (isOwner) {
              if (!myMusicList.some(m => m.id === item.id)) {
                myMusicList.push(musicItem);
              }
            } else if (item.is_public) {
              publicMusicList.push(musicItem);
            }
          });
        }
      } catch (e) {
        console.error("Failed to load database music:", e);
      }

      setCustomMusic(myMusicList);
      setPublicMusic(publicMusicList);
      setIsLoading(false);
    };

    loadMusic();
  }, []);

  const addMusic = useCallback((music: { name: string; url: string }) => {
    const newMusic: CustomMusic = {
      id: `local-${Date.now()}`,
      name: music.name,
      url: music.url,
      isLocal: true,
      isOwner: true,
    };

    setCustomMusic(prev => {
      const updated = [newMusic, ...prev];
      
      // Save local music to localStorage
      const localMusic = updated.filter(m => m.isLocal);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localMusic));
      
      return updated;
    });

    return newMusic;
  }, []);

  const removeMusic = useCallback(async (id: string) => {
    const music = customMusic.find(m => m.id === id);
    if (!music) return;

    if (music.isLocal) {
      // Remove from localStorage
      setCustomMusic(prev => {
        const updated = prev.filter(m => m.id !== id);
        const localMusic = updated.filter(m => m.isLocal);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localMusic));
        return updated;
      });
    } else {
      // Remove from database
      const { error } = await supabase
        .from("custom_music" as any)
        .delete()
        .eq("id", id);

      if (!error) {
        setCustomMusic(prev => prev.filter(m => m.id !== id));
      }
    }
  }, [customMusic]);

  const renameMusic = useCallback(async (id: string, newName: string) => {
    const music = customMusic.find(m => m.id === id);
    if (!music || !newName.trim()) return;

    if (music.isLocal) {
      setCustomMusic(prev => {
        const updated = prev.map(m => m.id === id ? { ...m, name: newName.trim() } : m);
        const localMusic = updated.filter(m => m.isLocal);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localMusic));
        return updated;
      });
    } else {
      const { error } = await supabase
        .from("custom_music" as any)
        .update({ name: newName.trim() })
        .eq("id", id);

      if (!error) {
        setCustomMusic(prev => prev.map(m => m.id === id ? { ...m, name: newName.trim() } : m));
      }
    }
  }, [customMusic]);

  const reorderMusic = useCallback((fromIndex: number, toIndex: number) => {
    setCustomMusic(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      
      // Save local music order
      const localMusic = updated.filter(m => m.isLocal);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localMusic));
      
      return updated;
    });
  }, []);

  const togglePublic = useCallback(async (id: string) => {
    const music = customMusic.find(m => m.id === id);
    if (!music || music.isLocal) return; // Local music can't be made public

    const newIsPublic = !music.isPublic;
    const { error } = await supabase
      .from("custom_music" as any)
      .update({ is_public: newIsPublic })
      .eq("id", id);

    if (!error) {
      setCustomMusic(prev => prev.map(m => 
        m.id === id ? { ...m, isPublic: newIsPublic } : m
      ));
    }
  }, [customMusic]);

  return {
    customMusic,
    publicMusic,
    isLoading,
    addMusic,
    removeMusic,
    renameMusic,
    reorderMusic,
    togglePublic,
  };
}
