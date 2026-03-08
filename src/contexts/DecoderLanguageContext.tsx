import { createContext, useContext, useState, ReactNode } from "react";
import type { Language } from "@/lib/buoyancisDecoder";

export const LANGUAGE_OPTIONS: { value: Language; label: string; nativeLabel: string }[] = [
  { value: "en", label: "English", nativeLabel: "EN" },
  { value: "zh", label: "Chinese", nativeLabel: "中文" },
  { value: "ja", label: "Japanese", nativeLabel: "日本語" },
  { value: "ko", label: "Korean", nativeLabel: "한국어" },
];

interface DecoderLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const DecoderLanguageContext = createContext<DecoderLanguageContextType | undefined>(undefined);

export function DecoderLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get from localStorage
    const saved = localStorage.getItem("decoder-language");
    if (saved === "zh" || saved === "en" || saved === "ja" || saved === "ko") {
      return saved;
    }
    return "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("decoder-language", lang);
  };

  const toggleLanguage = () => {
    const languages: Language[] = ["en", "zh", "ja", "ko"];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    handleSetLanguage(languages[nextIndex]);
  };

  return (
    <DecoderLanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, toggleLanguage }}>
      {children}
    </DecoderLanguageContext.Provider>
  );
}

export function useDecoderLanguage() {
  const context = useContext(DecoderLanguageContext);
  if (context === undefined) {
    throw new Error("useDecoderLanguage must be used within a DecoderLanguageProvider");
  }
  return context;
}
