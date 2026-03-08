import { useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import CookiePreferencesModal from "./CookiePreferencesModal";

// Founder's philosophical axioms - easter eggs
const axioms = [
  "熵增是必然的。結構是一種選擇。",
  "秩序是昂貴的驚喜，熵增是免費的宿命。",
  "真理不在於喧嘩，而在於被證實的沉默。",
  "五輩子的勞動，建造比混沌更持久的紀念碑。",
  "信任不是給予的，是賺取的——一次評論，經年累月。",
];

const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
  const [currentAxiom, setCurrentAxiom] = useState(0);

  const cycleAxiom = () => {
    setCurrentAxiom((prev) => (prev + 1) % axioms.length);
  };

  return (
    <footer ref={ref} className="pt-24 pb-20 border-t border-gold/10 bg-background">
      <div className="container-narrow">
        <div className="flex flex-col items-center text-center">
          {/* Logo with gold accent */}
          <h3 className="text-2xl font-serif text-gold mb-2">
            Buoyancis
          </h3>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50 mb-8">
            The Anti-Entropy Engine
          </p>

          {/* Philosophical axiom - clickable easter egg */}
          <button
            onClick={cycleAxiom}
            className="group max-w-lg mx-auto mb-10 cursor-pointer"
          >
            <blockquote className="text-sm text-muted-foreground/70 font-serif italic leading-relaxed group-hover:text-gold/70 transition-colors duration-300">
              「{axioms[currentAxiom]}」
            </blockquote>
            <p className="text-[10px] text-muted-foreground/30 mt-2 uppercase tracking-widest">
              Click to reveal more axioms
            </p>
          </button>

          {/* Divider */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-10" />

          {/* Privacy Manifesto Highlight */}
          <div className="max-w-md mx-auto mb-12 p-4 rounded-lg border border-gold/20 bg-gold/5">
            <p className="text-xs text-gold/80 font-medium mb-2 uppercase tracking-wider">
              隱私宣言
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Buoyancis <span className="text-gold">永不出售</span>您的數據。您的評論記錄、瀏覽歷史和個人資訊
              僅用於計算信任權重，絕不會被轉售給第三方廣告商。這是協議的承諾。
            </p>
            <Link 
              to="/legal/privacy" 
              className="inline-block mt-2 text-[10px] text-gold/60 hover:text-gold transition-colors uppercase tracking-wider"
            >
              閱讀完整隱私政策 →
            </Link>
          </div>

          {/* Primary links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/50 mb-6">
            <a href="#about-team" className="hover:text-gold transition-colors">
              團隊
            </a>
            <Link to="/tools/decoder" className="hover:text-gold transition-colors">
              Decoder
            </Link>
            <a href="#trust-demo" className="hover:text-gold transition-colors">
              互動演示
            </a>
            <Link to="/legal/terms" className="hover:text-gold transition-colors">
              服務條款
            </Link>
            <button 
              onClick={() => setShowCookiePreferences(true)}
              className="hover:text-gold transition-colors"
            >
              Cookie 設定
            </button>
            <Link to="/auth/login" className="hover:text-gold transition-colors">
              管理員
            </Link>
          </div>

          {/* Secondary links */}
          <div className="flex items-center justify-center gap-x-5 text-xs text-muted-foreground/40 mb-14">
            <Link to="/manifesto" className="hover:text-gold/70 transition-colors">
              Manifesto
            </Link>
            <span className="text-border">·</span>
            <Link to="/guidelines" className="hover:text-gold/70 transition-colors">
              Guidelines
            </Link>
            <span className="text-border">·</span>
            <Link to="/legal/privacy" className="hover:text-gold/70 transition-colors">
              Privacy
            </Link>
          </div>

          <CookiePreferencesModal 
            isOpen={showCookiePreferences} 
            onClose={() => setShowCookiePreferences(false)} 
          />

          {/* Copyright */}
          <div className="text-center space-y-1.5">
            <p className="text-[11px] text-muted-foreground/40 tracking-wide">
              © 2026 Buoyancis. Built with intention.
            </p>
            <p className="text-[10px] text-gold/40 font-mono tracking-wide">
              Engineered in Stockholm. Anchored in Truth.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
