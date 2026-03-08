import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";

// Filter animation stages
type FilterStage = 'idle' | 'filtering' | 'complete';

// Real audit data: Restaurang Cypern - discovering a hidden gem
const AUDIT_DATA = {
  entity: "RESTAURANG CYPERN",
  location: "Valhallavägen, Stockholm",
  protocol: "B-Protocol: 0xCYP7...R9N",
  // The noise - legacy platform data (undervalued)
  legacy: {
    source: "RAW AVERAGE",
    platforms: "Google / TripAdvisor",
    rating: 4.4,
    totalInputs: 892,
    label: "Diluted by Casual Signals",
    analysis: "High Entropy Environment",
  },
  // The physics - how we recalculate
  filters: [
    { 
      id: 'dampen',
      name: "DAMPENING", 
      type: "tourist",
      icon: "📉",
      weight: "0.1×",
      target: "Tourist / First-time Visitors",
      detail: "Casual signals lack context depth",
      count: 634,
      color: "text-slate-400",
    },
    { 
      id: 'amplify',
      name: "AMPLIFYING", 
      type: "local",
      icon: "📈",
      weight: "10×",
      target: "Verified Locals (>5 yrs)",
      detail: "High retention rate = truth signal",
      count: 127,
      color: "text-emerald-400",
    },
    { 
      id: 'pattern',
      name: "PATTERN DETECTED", 
      type: "insight",
      icon: "◆",
      weight: "",
      target: "Loyalty Coefficient: 0.94",
      detail: "Exceptionally high repeat visitor rate",
      count: 0,
      color: "text-[#B76E79]",
    },
  ],
  // The truth - Buoyancis signal (elevated)
  truth: {
    source: "TRUE MASS",
    rating: 4.9,
    status: "HIDDEN GEM",
    statusIcon: "💎",
    verifiedNodes: 127,
    insight: "Consensus among High-Gravity Nodes",
    localWeight: "Local regulars weighted 10×",
  },
  // Live feed examples
  liveEvents: [
    { 
      nodeId: "#088", 
      type: "Local Resident", 
      rating: 5.0, 
      weight: "Heavy", 
      action: "Signal Boosted",
      isPositive: true,
    },
    { 
      nodeId: "Anonymous", 
      type: "No History", 
      rating: 3.0, 
      note: '"Too loud"',
      weight: "Zero", 
      action: "Discarded as Noise",
      isPositive: false,
    },
    { 
      nodeId: "#042", 
      type: "Regular (8 yrs)", 
      rating: 5.0, 
      weight: "Platinum", 
      action: "Signal Verified",
      isPositive: true,
    },
    { 
      nodeId: "Tourist", 
      type: "First Visit", 
      rating: 4.0, 
      note: '"Decor dated"',
      weight: "Minimal", 
      action: "Dampened",
      isPositive: false,
    },
  ],
};

const TruthConsole = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [filterStage, setFilterStage] = useState<FilterStage>('idle');
  const [currentFilterIndex, setCurrentFilterIndex] = useState(-1);
  const [showTruth, setShowTruth] = useState(false);
  const [currentRating, setCurrentRating] = useState(AUDIT_DATA.legacy.rating);
  const [feedIndex, setFeedIndex] = useState(-1);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setTimeout(() => {
            setFilterStage('filtering');
            setHasAnimated(true);
          }, 1500);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  // Filter animation sequence
  useEffect(() => {
    if (filterStage !== 'filtering') return;

    const filters = AUDIT_DATA.filters;
    let index = 0;

    const runFilter = () => {
      if (index >= filters.length) {
        // Animate rating change
        const startRating = AUDIT_DATA.legacy.rating;
        const endRating = AUDIT_DATA.truth.rating;
        const duration = 1500;
        const startTime = Date.now();
        
        const animateRating = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = startRating + (endRating - startRating) * eased;
          setCurrentRating(Math.round(current * 10) / 10);
          
          if (progress < 1) {
            requestAnimationFrame(animateRating);
          } else {
            setFilterStage('complete');
            setShowTruth(true);
            // Start live feed animation
            startLiveFeed();
          }
        };
        
        requestAnimationFrame(animateRating);
        return;
      }

      setCurrentFilterIndex(index);
      index++;
      setTimeout(runFilter, 1200);
    };

    runFilter();
  }, [filterStage]);

  // Live feed animation
  const startLiveFeed = () => {
    let idx = 0;
    const showNext = () => {
      if (idx >= AUDIT_DATA.liveEvents.length) {
        idx = 0; // Loop
      }
      setFeedIndex(idx);
      idx++;
      setTimeout(showNext, 3000);
    };
    showNext();
  };

  return (
    <section 
      ref={sectionRef}
      className="section-padding relative overflow-hidden bg-[#0D0D0D]"
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />
      
      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Section intro */}
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xs uppercase tracking-[0.4em] text-[#B76E79] mb-4">
            ◇ Live Forensic Audit ◇
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-3">
            The Truth Console
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Discovering hidden gems buried under noise. Real data. Real physics. Real truth.
          </p>
        </div>

        {/* Main Console Container */}
        <div 
          className={`rounded-xl border border-slate-800 bg-[#111111] shadow-2xl overflow-hidden transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 border-b border-slate-800 bg-[#0A0A0A]">
            <div className="flex items-center gap-4 mb-3 md:mb-0">
              <div>
                <h3 className="text-lg font-semibold text-white tracking-tight">{AUDIT_DATA.entity}</h3>
                <p className="text-[10px] font-mono text-slate-600">{AUDIT_DATA.protocol}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`text-[10px] uppercase tracking-wider transition-all duration-500 ${
                  showTruth 
                    ? 'border-[#B76E79]/50 text-[#B76E79] bg-[#B76E79]/10' 
                    : filterStage === 'filtering'
                    ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                    : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                  showTruth ? 'bg-[#B76E79] animate-pulse' : 
                  filterStage === 'filtering' ? 'bg-amber-400 animate-pulse' : 
                  'bg-slate-400'
                }`} />
                {showTruth ? 'High Integrity Node' : 
                 filterStage === 'filtering' ? 'Analyzing...' : 
                 'Awaiting Audit'}
              </Badge>
              <span className="text-[10px] text-slate-600 font-mono">{AUDIT_DATA.location}</span>
            </div>
          </div>

          {/* Three Column Layout: The Noise → The Physics → The Signal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            
            {/* LEFT: The Noise (Undervalued Legacy) */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-slate-800 relative">
              <div className={`transition-all duration-500 ${showTruth ? 'opacity-40' : 'opacity-100'}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">{AUDIT_DATA.legacy.source}</p>
                <p className="text-[8px] text-slate-600 mb-4">{AUDIT_DATA.legacy.platforms}</p>
                
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-light text-slate-400 tabular-nums">
                    {AUDIT_DATA.legacy.rating}
                  </span>
                  <span className="text-2xl text-slate-600 mb-2">★</span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-slate-600">Based on</span>
                  <span className="text-sm text-slate-400 font-mono">{AUDIT_DATA.legacy.totalInputs.toLocaleString()}</span>
                  <span className="text-xs text-slate-600">inputs</span>
                </div>
                
                <div className="inline-block px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {AUDIT_DATA.legacy.label}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-600 mt-3 italic">
                  {AUDIT_DATA.legacy.analysis}
                </p>
              </div>

              {/* Fade overlay when complete */}
              {showTruth && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0D0D0D]/50 pointer-events-none" />
              )}
            </div>

            {/* CENTER: The Physics (Processing Animation) */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0A0A0A]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#B76E79] mb-4">
                Applying Reputation Physics...
              </p>
              
              {/* Filter steps */}
              <div className="space-y-4">
                {AUDIT_DATA.filters.map((filter, index) => {
                  const isActive = currentFilterIndex === index;
                  const isComplete = currentFilterIndex > index || filterStage === 'complete';
                  
                  return (
                    <div 
                      key={filter.id}
                      className={`p-3 rounded border transition-all duration-300 ${
                        isActive 
                          ? 'border-[#B76E79]/50 bg-[#B76E79]/5' 
                          : isComplete 
                          ? 'border-slate-700 bg-slate-800/30'
                          : 'border-slate-800 bg-transparent opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-2 ${
                          isActive ? 'text-[#B76E79]' : isComplete ? filter.color : 'text-slate-600'
                        }`}>
                          <span>{filter.icon}</span>
                          {filter.name}
                        </span>
                        {filter.weight && (isActive || isComplete) && (
                          <span className={`text-xs font-mono font-bold ${filter.color}`}>
                            {filter.weight}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isComplete ? 'text-white' : 'text-slate-500'}`}>
                        {filter.target}
                      </p>
                      {(isActive || isComplete) && (
                        <p className="text-[9px] text-slate-600 mt-1 italic">{filter.detail}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rating transition indicator */}
              {filterStage !== 'idle' && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Recalculating Mass...</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-slate-400">{AUDIT_DATA.legacy.rating}★</span>
                      <span className="text-slate-600">→</span>
                      <span className={`text-sm font-mono transition-colors duration-500 ${
                        showTruth ? 'text-gold' : 'text-[#B76E79]'
                      }`}>
                        {currentRating.toFixed(1)}★
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: The Signal (Hidden Gem Revealed) */}
            <div className={`p-6 transition-all duration-700 ${showTruth ? 'opacity-100' : 'opacity-30'}`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold mb-1">{AUDIT_DATA.truth.source}</p>
              <p className="text-[8px] text-slate-600 mb-4">Buoyancis Signal</p>
              
              <div className="flex items-end gap-3 mb-2">
                <span className={`text-5xl md:text-6xl font-light tabular-nums transition-all duration-500 ${
                  showTruth ? 'text-gold' : 'text-slate-600'
                }`}>
                  {showTruth ? AUDIT_DATA.truth.rating : currentRating.toFixed(1)}
                </span>
                <span className={`text-2xl mb-2 transition-all duration-500 ${
                  showTruth ? 'text-gold' : 'text-slate-600'
                }`}>★</span>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500">From</span>
                <span className={`text-sm font-mono transition-all duration-500 ${
                  showTruth ? 'text-emerald-400' : 'text-slate-600'
                }`}>{AUDIT_DATA.truth.verifiedNodes}</span>
                <span className="text-xs text-slate-500">high-gravity nodes</span>
              </div>

              {showTruth && (
                <div className="space-y-3 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#B76E79]/10 border border-[#B76E79]/30">
                    <span className="text-base">{AUDIT_DATA.truth.statusIcon}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[#B76E79] font-medium">
                      {AUDIT_DATA.truth.status}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 italic">
                    {AUDIT_DATA.truth.insight}
                  </p>
                  
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 mb-1">Weighting Applied:</p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      {AUDIT_DATA.truth.localWeight}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Feed */}
          {showTruth && feedIndex >= 0 && (
            <div className="border-t border-slate-800 bg-[#0A0A0A]">
              <div className="px-4 md:px-6 py-3 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Live Verification Feed</span>
                </div>
              </div>
              <div className="px-4 md:px-6 py-4">
                {AUDIT_DATA.liveEvents.slice(0, feedIndex + 1).map((event, idx) => (
                  <div 
                    key={idx}
                    className={`py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 transition-all duration-500 ${
                      idx === feedIndex ? 'opacity-100' : 'opacity-50'
                    }`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[#B76E79]">[LIVE]</span>
                      <span className="text-xs text-white">
                        Node {event.nodeId}
                      </span>
                      <span className="text-[10px] text-slate-500">({event.type})</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-400">
                        Rated: <span className={event.isPositive ? 'text-gold' : 'text-slate-500'}>{event.rating}</span>
                        {event.note && <span className="text-[10px] text-slate-600 ml-1">{event.note}</span>}
                      </span>
                      <span className="text-[10px] text-slate-600">→</span>
                      <span className={`text-[10px] font-mono ${
                        event.isPositive ? 'text-emerald-400' : 'text-red-400/60'
                      }`}>
                        Weight: {event.weight}
                      </span>
                      <span className="text-[10px] text-slate-600">→</span>
                      <span className={`text-[10px] ${
                        event.isPositive ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {event.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom: The Insight */}
          <div className="border-t border-slate-800 bg-[#0A0A0A] px-4 md:px-6 py-4">
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-700 ${
              showTruth ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Audit Result:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{AUDIT_DATA.legacy.rating}★</span>
                  <span className="text-emerald-400">→</span>
                  <span className="text-sm text-gold font-medium">{AUDIT_DATA.truth.rating}★</span>
                </div>
                <span className="text-xs text-emerald-400">
                  ▲ +{((AUDIT_DATA.truth.rating - AUDIT_DATA.legacy.rating) / AUDIT_DATA.legacy.rating * 100).toFixed(0)}% correction
                </span>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                "Google said 4.4. The locals knew it was 4.9."
              </p>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className={`text-center mt-8 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-600">
            We find <span className="text-[#B76E79]">hidden gems</span> buried under noise.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TruthConsole;
