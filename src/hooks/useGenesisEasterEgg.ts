import { useState, useEffect, useCallback } from 'react';

const TARGET_SEQUENCE = ['g', 'e', 'n', 'e', 's', 'i', 's'];

export const useGenesisEasterEgg = () => {
  const [isTriggered, setIsTriggered] = useState(false);
  const [inputSequence, setInputSequence] = useState<string[]>([]);

  const resetEasterEgg = useCallback(() => {
    setIsTriggered(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      
      // Only track alphabetic keys
      if (!/^[a-z]$/.test(key)) {
        return;
      }

      setInputSequence((prev) => {
        const newSequence = [...prev, key].slice(-TARGET_SEQUENCE.length);
        
        // Check if sequence matches
        if (newSequence.join('') === TARGET_SEQUENCE.join('')) {
          setIsTriggered(true);
          return [];
        }
        
        return newSequence;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isTriggered, resetEasterEgg };
};
