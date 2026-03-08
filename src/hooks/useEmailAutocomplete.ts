import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UseEmailAutocompleteOptions {
  maxSuggestions?: number;
  maxHistoryItems?: number;
  /** If true, also loads emails from localStorage (merged with DB history) */
  includeLocalStorage?: boolean;
  /** localStorage key for saving/loading emails */
  localStorageKey?: string;
  /** Initial value for the input */
  initialValue?: string;
}

interface UseEmailAutocompleteReturn {
  value: string;
  setValue: (value: string) => void;
  userEmail: string | null;
  recentEmails: string[];
  isLoading: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  filteredEmails: string[];
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  clearValue: () => void;
  fillWithUserEmail: () => void;
  /** Save emails to localStorage (useful after successful operations) */
  saveToLocalStorage: (emails: string[]) => void;
  /** Get filtered suggestions for multi-email input (filters based on text after last comma) */
  getMultiEmailSuggestions: (existingEmails: string[]) => string[];
}

export function useEmailAutocomplete(
  options: UseEmailAutocompleteOptions = {}
): UseEmailAutocompleteReturn {
  const { 
    maxSuggestions = 5, 
    maxHistoryItems = 20,
    includeLocalStorage = false,
    localStorageKey = "email_suggestions",
    initialValue = ""
  } = options;

  const [value, setValue] = useState(initialValue);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  const [localEmails, setLocalEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Load from localStorage if enabled
  useEffect(() => {
    if (includeLocalStorage && localStorageKey) {
      try {
        const saved = localStorage.getItem(localStorageKey);
        if (saved) {
          setLocalEmails(JSON.parse(saved));
        }
      } catch {
        setLocalEmails([]);
      }
    }
  }, [includeLocalStorage, localStorageKey]);

  // Fetch from DB
  useEffect(() => {
    const fetchUserAndRecentEmails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }

      setIsLoading(true);
      try {
        const { data: historyData } = await supabase
          .from("notification_history")
          .select("recipients")
          .order("created_at", { ascending: false })
          .limit(50);

        if (historyData) {
          const allEmails = historyData.flatMap(h => h.recipients || []);
          const uniqueEmails = [...new Set(allEmails)].slice(0, maxHistoryItems);
          setRecentEmails(uniqueEmails);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndRecentEmails();
  }, [maxHistoryItems]);

  // Merge DB emails with localStorage emails
  const allEmails = [...new Set([...recentEmails, ...localEmails])];

  const filteredEmails = allEmails
    .filter(email => !value || email.toLowerCase().includes(value.toLowerCase()))
    .slice(0, maxSuggestions);

  // For multi-email inputs (comma-separated), filter based on text after last comma
  const getMultiEmailSuggestions = useCallback((existingEmails: string[]) => {
    const parts = value.split(",");
    const currentPart = parts[parts.length - 1].trim().toLowerCase();
    const existingLower = existingEmails.map(e => e.toLowerCase());
    
    return allEmails
      .filter(email => 
        email.toLowerCase().includes(currentPart) &&
        !existingLower.includes(email.toLowerCase())
      )
      .slice(0, maxSuggestions);
  }, [value, allEmails, maxSuggestions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredEmails.length === 0) {
      if (e.key === "ArrowDown" && allEmails.length > 0) {
        setShowSuggestions(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredEmails.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredEmails.length - 1
        );
        break;
      case "Enter":
        if (highlightedIndex >= 0 && highlightedIndex < filteredEmails.length) {
          e.preventDefault();
          setValue(filteredEmails[highlightedIndex]);
          setShowSuggestions(false);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [showSuggestions, filteredEmails, highlightedIndex, allEmails.length]);

  const clearValue = useCallback(() => {
    setValue("");
    setHighlightedIndex(-1);
  }, []);

  const fillWithUserEmail = useCallback(() => {
    if (userEmail) {
      setValue(userEmail);
    }
  }, [userEmail]);

  const saveToLocalStorage = useCallback((emails: string[]) => {
    if (!localStorageKey) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter(e => emailRegex.test(e));
    const merged = [...new Set([...validEmails, ...localEmails])].slice(0, maxHistoryItems);
    setLocalEmails(merged);
    localStorage.setItem(localStorageKey, JSON.stringify(merged));
  }, [localStorageKey, localEmails, maxHistoryItems]);

  return {
    value,
    setValue,
    userEmail,
    recentEmails: allEmails,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    highlightedIndex,
    setHighlightedIndex,
    filteredEmails,
    handleKeyDown,
    clearValue,
    fillWithUserEmail,
    saveToLocalStorage,
    getMultiEmailSuggestions,
  };
}
