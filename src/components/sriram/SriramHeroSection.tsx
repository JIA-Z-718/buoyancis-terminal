import { useEffect, useState } from "react";

const SriramHeroSection = () => {
  const [loaded, setLoaded] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Democracy cannot survive Infinite Noise.";

  useEffect(() => {
    setLoaded(true);
    // Typewriter effect
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);
    return () => clearInterval(typeInterval);
  }, []);

  return (
    <section className="min-h-screen flex flex-col justify-center relative overflow-hidden bg-[#0a1628]">
      {/* Architectural grid */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Diagonal architectural lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-px h-[150%] bg-gradient-to-b from-cyan-400/20 via-cyan-400/5 to-transparent origin-top-right rotate-[15deg]" />
        <div className="absolute top-0 right-20 w-px h-[150%] bg-gradient-to-b from-white/10 via-white/3 to-transparent origin-top-right rotate-[15deg]" />
        <div className="absolute top-0 right-40 w-px h-[150%] bg-gradient-to-b from-cyan-400/10 via-transparent to-transparent origin-top-right rotate-[15deg]" />
      </div>

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Pre-header */}
        <div className={`mb-12 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 border border-cyan-400/30 bg-cyan-400/5 backdrop-blur-sm">
            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
            <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase font-light">
              Security Clearance: Node #001 // Sriram Krishnan
            </span>
          </div>
        </div>

        {/* Headlines */}
        <div className={`space-y-6 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1]">
            The Social Graph
            <br />
            <span className="text-cyan-400">has Collapsed.</span>
          </h1>

          {/* Typewriter sub-headline */}
          <div className="h-12 md:h-16">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-white/60 tracking-wide">
              {typedText}
              <span className="animate-pulse text-cyan-400">|</span>
            </h2>
          </div>
        </div>

        {/* Body Text */}
        <div className={`mt-16 max-w-2xl transition-opacity duration-500 delay-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/50 text-lg leading-relaxed font-light">
            You are advising the nation on AI. You know the threat better than anyone.
          </p>
          <p className="text-white/50 text-lg leading-relaxed font-light mt-4">
            When content cost drops to zero, truth becomes a needle in a haystack of needles.
          </p>
          
          <div className="mt-8 border-l-2 border-cyan-400/30 pl-6">
            <p className="text-cyan-400/80 text-lg font-light">
              We are facing an <span className="text-white">Entropy Event</span>:
            </p>
            <p className="text-white/40 text-base mt-2 font-light">
              The point where synthetic media overwhelms human consensus.
            </p>
            <p className="text-white/40 text-base mt-2 font-light">
              The old platforms <span className="text-white/20">(X, Meta)</span> are too flat to stop it.
            </p>
            <p className="text-white/40 text-base mt-2 font-light">
              They lack the <span className="text-cyan-400">physics</span> to differentiate signal from noise.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-cyan-400/60 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SriramHeroSection;
