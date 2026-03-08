import { useEffect, useRef, useState } from "react";
import { Shield, Database, BookOpen, Globe, Users, Lightbulb } from "lucide-react";

const founders = [
  {
    icon: Database,
    title: "數據科學背景",
    description: "前 FAANG 數據科學家，專精於異常檢測與反詐欺系統。曾建構處理數十億筆交易的信任評分模型。",
  },
  {
    icon: BookOpen,
    title: "調查新聞經驗",
    description: "資深調查記者，深耕假新聞與網路操作研究。理解資訊戰如何扭曲公眾認知。",
  },
  {
    icon: Globe,
    title: "在地社群專家",
    description: "社區營造實踐者，深知「真正的當地人」如何評價一個地方，以及遊客與居民的認知落差。",
  },
];

const principles = [
  {
    icon: Shield,
    title: "信任需要被賺取",
    description: "影響力應該與可驗證的專業性和在地經驗成正比，而非誰喊得最大聲。",
  },
  {
    icon: Users,
    title: "保護真實聲音",
    description: "協議的使命是讓真正有見地的評論浮出水面，同時降低虛假與操縱性內容的影響力。",
  },
  {
    icon: Lightbulb,
    title: "透明演算法",
    description: "權重計算邏輯完全公開，讓每位用戶都能理解自己的評論如何被評估和加權。",
  },
];

const TeamOrigin = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about-team"
      className="section-padding bg-background relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid opacity-5" />
      
      <div className="container-narrow relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className={`text-xs uppercase tracking-[0.4em] text-gold/80 mb-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 animate-chromatic-shimmer" : "opacity-0"
            }`}
          >
            ◇ Origin Story ◇
          </p>
          <h2
            className={`text-3xl md:text-4xl font-serif mb-4 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-holographic">Buoyancis 的起源</span>
          </h2>
          <p
            className={`text-muted-foreground max-w-2xl mx-auto transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            厭倦了被虛假評論欺騙。在親眼見證水軍如何摧毀一家真正優秀的小店後，
            決定用專業知識建構一個更公平的評價系統。
          </p>
        </div>

        {/* The Manifesto */}
        <div
          className={`max-w-3xl mx-auto mb-16 transition-all duration-700 ease-out delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Manifesto Header */}
          <div className="text-center mb-8">
            <h3 className="text-xs uppercase tracking-[0.3em] text-gold/60 mb-3">The Manifesto</h3>
            <p className="text-2xl font-serif text-foreground italic">
              "Why We Built This"
            </p>
          </div>
          
          {/* Manifesto Content */}
          <div className="p-8 rounded-2xl border border-gold/20 bg-gradient-to-b from-gold/5 to-transparent relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-3 left-3 w-6 h-6 border-l border-t border-gold/30" />
            <div className="absolute top-3 right-3 w-6 h-6 border-r border-t border-gold/30" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-l border-b border-gold/30" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-r border-b border-gold/30" />
            
            <div className="relative space-y-6 text-base md:text-lg leading-relaxed">
              <p className="text-foreground/90 font-serif">
                在資訊爆炸的時代，<span className="text-gold">真相反而變得稀缺</span>。
                每一則虛假評論都是對信任的蛀蝕，每一個買來的星級都是對公平的侮辱。
              </p>
              
              <p className="text-foreground/80">
                選擇回歸真實——不是懷舊的真實，而是<span className="text-gold/80">經得起演算法驗證的真實</span>。
                不追求最大的流量，只追求最有價值的信號。
              </p>
              
              <p className="text-foreground/80">
                在一個「熵增免費」的世界裡，
                <span className="text-gold">秩序才是最昂貴的商品</span>。
              </p>
              
              <div className="pt-6 border-t border-gold/10">
                <p className="text-sm text-gold/60 italic text-center">
                  "Entropy is inevitable. Structure is a choice."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Origin Story - Condensed */}
        <div
          className={`max-w-2xl mx-auto mb-16 p-6 rounded-xl border border-border/50 bg-foreground/[0.02] transition-all duration-700 ease-out delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <blockquote className="text-sm md:text-base text-muted-foreground leading-relaxed italic">
            「那是一家營業 30 年的家庭餐館，卻因為拒絕付費給網紅，在三個月內被惡意差評淹沒。
            那一刻，明白了評論系統已被武器化——而建造者擁有反擊的能力。」
          </blockquote>
          <p className="text-xs text-gold/50 font-mono mt-4 text-right">
            — Buoyancis 創始團隊
          </p>
        </div>

        {/* Founding Team Background */}
        <div className="mb-16">
          <h3
            className={`text-lg font-serif text-center text-gold/80 mb-8 transition-all duration-700 ease-out delay-400 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            創始團隊背景
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {founders.map((founder, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border border-border bg-foreground/[0.02] transition-all duration-500 ease-out hover:border-gold/30 hover:bg-gold/5 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${500 + index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                  <founder.icon className="w-6 h-6 text-gold" />
                </div>
                <h4 className="text-sm font-medium text-foreground mb-2">{founder.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {founder.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Principles */}
        <div>
          <h3
            className={`text-lg font-serif text-center text-gold/80 mb-8 transition-all duration-700 ease-out delay-700 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            核心原則
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {principles.map((principle, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border border-gold/20 bg-gold/5 transition-all duration-500 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${800 + index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mb-4">
                  <principle.icon className="w-5 h-5 text-gold" />
                </div>
                <h4 className="text-sm font-medium text-gold mb-2">{principle.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signal */}
        <div
          className={`mt-12 text-center transition-all duration-700 ease-out delay-1000 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
            立案於台北 · 服務全球華人社群
          </p>
        </div>
      </div>
    </section>
  );
};

export default TeamOrigin;
