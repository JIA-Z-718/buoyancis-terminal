import { useState, useEffect, useCallback } from "react";
import type { MemoryPhoto } from "@/components/node009/PhotoInjectionSystem";

const STORAGE_KEY = "node009-memory-photos";

export const useMemoryPhotos = () => {
  const [photos, setPhotos] = useState<MemoryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load photos from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MemoryPhoto[];
        setPhotos(parsed);
      }
    } catch (error) {
      console.error("Failed to load memory photos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save photos to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
      } catch (error) {
        console.error("Failed to save memory photos:", error);
      }
    }
  }, [photos, isLoading]);

  const addPhoto = useCallback((photo: MemoryPhoto) => {
    setPhotos((prev) => [...prev, photo]);
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  const updatePhoto = useCallback((photoId: string, updates: Partial<MemoryPhoto>) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, ...updates } : p))
    );
  }, []);

  return {
    photos,
    isLoading,
    addPhoto,
    removePhoto,
    updatePhoto,
  };
};

export default useMemoryPhotos;
