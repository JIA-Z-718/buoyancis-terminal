import { useEffect, useCallback, RefObject } from "react";

interface UseDecoderKeyboardOptions {
  inputRef: RefObject<HTMLInputElement>;
  decoded: { letter: string; concept: string }[];
  focusedCardIndex: number;
  historyLength: number;
  setFocusedCardIndex: (index: number) => void;
  setInput: (input: string) => void;
  goToPreviousWord: () => void;
  goToNextWord: () => void;
  focusCard: (index: number) => void;
}

/**
 * Custom hook for handling keyboard navigation in the Decoder console
 * Centralizes all keyboard event logic for better maintainability
 */
export function useDecoderKeyboard({
  inputRef,
  decoded,
  focusedCardIndex,
  historyLength,
  setFocusedCardIndex,
  setInput,
  goToPreviousWord,
  goToNextWord,
  focusCard,
}: UseDecoderKeyboardOptions) {
  
  // Handle Escape key - clear input and reset focus
  const handleEscape = useCallback(() => {
    setInput("");
    setFocusedCardIndex(-1);
    inputRef.current?.focus();
  }, [setInput, setFocusedCardIndex, inputRef]);

  // Handle card navigation with arrow keys
  const handleCardNavigation = useCallback((
    key: string,
    e: KeyboardEvent | React.KeyboardEvent
  ): boolean => {
    if (decoded.length === 0) return false;

    const isInputFocused = document.activeElement === inputRef.current;

    // ArrowDown or Tab from input: move to first card
    if (
      (key === "ArrowDown" || (key === "Tab" && !(e as KeyboardEvent).shiftKey)) && 
      isInputFocused && 
      focusedCardIndex === -1
    ) {
      e.preventDefault();
      setFocusedCardIndex(0);
      focusCard(0);
      return true;
    }

    // ArrowUp from first card: return to input
    if (key === "ArrowUp" && focusedCardIndex === 0) {
      e.preventDefault();
      setFocusedCardIndex(-1);
      inputRef.current?.focus();
      return true;
    }

    // ArrowLeft: move to previous card
    if (key === "ArrowLeft" && focusedCardIndex > 0 && !(e as KeyboardEvent).altKey) {
      e.preventDefault();
      const newIndex = focusedCardIndex - 1;
      setFocusedCardIndex(newIndex);
      focusCard(newIndex);
      return true;
    }

    // ArrowRight: move to next card
    if (key === "ArrowRight" && focusedCardIndex >= 0 && focusedCardIndex < decoded.length - 1 && !(e as KeyboardEvent).altKey) {
      e.preventDefault();
      const newIndex = focusedCardIndex + 1;
      setFocusedCardIndex(newIndex);
      focusCard(newIndex);
      return true;
    }

    return false;
  }, [decoded.length, focusedCardIndex, inputRef, setFocusedCardIndex, focusCard]);

  // Handle history navigation with Alt+Arrow keys
  const handleHistoryNavigation = useCallback((
    key: string,
    altKey: boolean,
    e: KeyboardEvent | React.KeyboardEvent
  ): boolean => {
    // Only allow history navigation when no card is focused
    if (focusedCardIndex !== -1 || historyLength === 0 || !altKey) return false;

    if (key === "ArrowLeft") {
      e.preventDefault();
      goToPreviousWord();
      return true;
    }

    if (key === "ArrowRight") {
      e.preventDefault();
      goToNextWord();
      return true;
    }

    return false;
  }, [focusedCardIndex, historyLength, goToPreviousWord, goToNextWord]);

  // Unified keyboard event handler for input element
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    const key = e.key;

    // Handle Escape
    if (key === "Escape") {
      e.preventDefault();
      handleEscape();
      return;
    }

    // Try card navigation first
    if (handleCardNavigation(key, e)) return;

    // Then try history navigation
    if (handleHistoryNavigation(key, e.altKey, e)) return;
  }, [handleEscape, handleCardNavigation, handleHistoryNavigation]);

  // Global keyboard listener for shortcuts that work regardless of focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input (other than our decoder input)
      const target = e.target as HTMLElement;
      const isOtherInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const isDecoderInput = target === inputRef.current;
      
      if (isOtherInput && !isDecoderInput) return;

      // Handle Alt+Arrow for history navigation (works globally)
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        if (handleHistoryNavigation(e.key, e.altKey, e)) return;
      }

      // Handle Escape globally
      if (e.key === "Escape") {
        e.preventDefault();
        handleEscape();
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [inputRef, handleHistoryNavigation, handleEscape]);

  return {
    handleInputKeyDown,
    handleEscape,
  };
}
