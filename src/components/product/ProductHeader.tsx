import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const toggleLang = () => setLang(lang === "en" ? "cn" : "en");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-lg font-bold tracking-tight text-foreground font-serif">
            Buoyancis
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.how")}
            </a>
            <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.blog")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg hover:bg-secondary"
              aria-label="Switch language"
            >
              <Globe className="w-3.5 h-3.5" />
              {t("lang.switch")}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-muted-foreground"
              aria-label={isMenuOpen ? "Close" : "Menu"}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border/50">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
              {t("nav.how")}
            </a>
            <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="py-2.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
              {t("footer.blog")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default ProductHeader;
