import { useDecoderLanguage, LANGUAGE_OPTIONS } from "@/contexts/DecoderLanguageContext";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LanguageToggle = () => {
  const { language, setLanguage } = useDecoderLanguage();
  const currentLang = LANGUAGE_OPTIONS.find(l => l.value === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/20 rounded-sm bg-white/[0.02] hover:bg-white/[0.05]"
          aria-label="Select language"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{currentLang?.nativeLabel || "EN"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-black/95 border-white/20 backdrop-blur-sm min-w-[140px]"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className={`text-xs font-mono uppercase tracking-wider cursor-pointer ${
              language === option.value
                ? "bg-[#5a6f3c]/30 text-[#5a6f3c]"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="mr-2">{option.nativeLabel}</span>
            <span className="text-white/40">{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;
