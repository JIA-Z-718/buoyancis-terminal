import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import DecoderConsole from "@/components/decoder/DecoderConsole";
import ManifestoSection from "@/components/manifesto/ManifestoSection";
import LanguageToggle from "@/components/decoder/LanguageToggle";
import { DecoderLanguageProvider } from "@/contexts/DecoderLanguageContext";
import KeyboardShortcutsOverlay, { useKeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Search } from "lucide-react";

// Decoder-specific keyboard shortcuts
const decoderShortcutGroups = [
  {
    title: "輸入 / Input",
    icon: <Search className="w-4 h-4 text-white/50" />,
    shortcuts: [
      { keys: ["Enter"], description: "解碼當前輸入的詞彙" },
      { keys: ["Esc"], description: "清除輸入欄位" },
    ],
  },
  {
    title: "卡片導航 / Card Navigation",
    icon: <ArrowRight className="w-4 h-4 text-white/50" />,
    shortcuts: [
      { keys: ["←", "→"], description: "切換概念卡片詳情" },
      { keys: ["Enter"], description: "開啟卡片詳情" },
      { keys: ["Esc"], description: "關閉對話框" },
    ],
  },
  {
    title: "歷史導航 / History Navigation",
    icon: <ArrowUp className="w-4 h-4 text-white/50" />,
    shortcuts: [
      { keys: ["Alt", "←"], description: "切換至上一個解碼詞彙" },
      { keys: ["Alt", "→"], description: "切換至下一個解碼詞彙" },
    ],
  },
  {
    title: "通用 / General",
    shortcuts: [
      { keys: ["Shift", "?"], description: "顯示/隱藏此快捷鍵幫助" },
      { keys: ["Ctrl", "P"], description: "列印 / 匯出 PDF" },
    ],
  },
];

const DecoderContent = () => {
  const [searchParams] = useSearchParams();
  const wordParam = searchParams.get("word");
  const { isOpen: showShortcuts, setIsOpen: setShowShortcuts } = useKeyboardShortcutsOverlay();

  // Force dark mode and set OG meta tags for this page
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "#000";

    // Store original meta tags
    const originalTitle = document.title;
    const originalMetas: { name: string; content: string }[] = [];

    // Set page title
    const pageTitle = wordParam 
      ? `${wordParam.toUpperCase()} — Buoyancis Decoder`
      : "The Decoder — Buoyancis";
    document.title = pageTitle;

    // Helper to set or create meta tag
    const setMetaTag = (property: string, content: string, isName = false) => {
      const attr = isName ? "name" : "property";
      let meta = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
      
      if (meta) {
        originalMetas.push({ name: property, content: meta.content });
        meta.content = content;
      } else {
        meta = document.createElement("meta");
        meta.setAttribute(attr, property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Generate decoded string for OG description
    const getDecodedPreview = (word: string) => {
      const letterMap: Record<string, string> = {
        A: "Asset", B: "Birth", C: "Care", D: "Depth", E: "Energy",
        F: "Flow", G: "Growth", H: "Harmony", I: "Integration", J: "Journey",
        K: "Knowledge", L: "Light", M: "Motion", N: "Network", O: "Order",
        P: "Power", Q: "Quest", R: "Rhythm", S: "Service", T: "Trust",
        U: "Unity", V: "Vision", W: "Wisdom", X: "Exchange", Y: "Yield", Z: "Zenith"
      };
      return word.toUpperCase().split("").filter(c => /[A-Z]/.test(c))
        .map(c => letterMap[c]?.charAt(0) || c).join("·");
    };

    const totemPreview = wordParam ? getDecodedPreview(wordParam) : "";
    const description = wordParam
      ? `${wordParam.toUpperCase()} → ${totemPreview} | Decode the structural DNA of any word into its fundamental concepts.`
      : "Transform any word into its structural DNA — Discover the hidden concepts within language.";
    
    // Dynamic OG image - use edge function for word-specific images
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://hilhvunhhhexhuneefmy.supabase.co";
    const ogImage = wordParam
      ? `${supabaseUrl}/functions/v1/og-image-decoder?word=${encodeURIComponent(wordParam)}`
      : "https://buoyancis.com/og-image.png";
    
    const ogUrl = wordParam
      ? `https://buoyancis.com/tools/decoder?word=${encodeURIComponent(wordParam)}`
      : "https://buoyancis.com/tools/decoder";

    // Set Open Graph tags
    setMetaTag("og:title", pageTitle);
    setMetaTag("og:description", description);
    setMetaTag("og:image", ogImage);
    setMetaTag("og:url", ogUrl);
    setMetaTag("og:type", "website");
    setMetaTag("og:site_name", "Buoyancis");

    // Set Twitter Card tags
    setMetaTag("twitter:card", "summary_large_image", true);
    setMetaTag("twitter:title", pageTitle, true);
    setMetaTag("twitter:description", description, true);
    setMetaTag("twitter:image", ogImage, true);
    setMetaTag("twitter:site", "@Buoyancis", true);

    // Set description meta
    setMetaTag("description", description, true);
    
    return () => {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "";
      document.title = originalTitle;
      
      // Restore original meta content (simplified cleanup)
      originalMetas.forEach(({ name, content }) => {
        const meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`) as HTMLMetaElement;
        if (meta) meta.content = content;
      });
    };
  }, [wordParam]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="text-white/40 hover:text-white/60 transition-colors font-mono text-xs uppercase tracking-widest"
          >
            ← Back
          </Link>
          <span className="text-white/20 font-mono text-xs tracking-[0.3em]">
            BUOYANCIS
          </span>
          <LanguageToggle />
        </div>
      </header>

      {/* Hero decoder section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto w-full">
          {/* Title */}
          <div className="text-center mb-16">
            <h1 className="text-sm font-mono uppercase tracking-[0.3em] text-white/30 mb-4">
              The Decoder
            </h1>
            <p className="text-white/50 text-lg md:text-xl font-light">
              Transform any word into its structural DNA
            </p>
          </div>

          {/* Decoder Console */}
          <DecoderConsole />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-30">
          <span className="text-xs font-mono uppercase tracking-widest text-white/40">
            Scroll
          </span>
          <div className="w-px h-8 bg-white/20" />
        </div>
      </section>

      {/* Manifesto section */}
      <ManifestoSection />

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs font-mono">
            © {new Date().getFullYear()} Buoyancis. Structure persists.
          </p>
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-white/30 hover:text-white/50 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              Theory
            </Link>
            <Link 
              to="/legal/privacy" 
              className="text-white/30 hover:text-white/50 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsOverlay
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        groups={decoderShortcutGroups}
        title="Decoder 快捷鍵"
      />
    </div>
  );
};

const Decoder = () => {
  return (
    <DecoderLanguageProvider>
      <DecoderContent />
    </DecoderLanguageProvider>
  );
};

export default Decoder;
