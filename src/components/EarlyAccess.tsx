import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { type TurnstileInstance } from "@marsidev/react-turnstile";
import TurnstileWrapper from "./TurnstileWrapper";
import { useParallax } from "@/hooks/useParallax";

// Cloudflare Turnstile site key (public - safe to expose)
const TURNSTILE_SITE_KEY = "0x4AAAAAABfBz0T_eE_wLYvn";

// Generate a simple challenge based on email for bot detection
const generateChallenge = (email: string): string => {
  // First 8 chars of email reversed + length
  return email.slice(0, 8).split('').reverse().join('') + email.length.toString();
};

const EarlyAccess = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [thresholdAnswer, setThresholdAnswer] = useState(""); // Gating question
  const [honeypot, setHoneypot] = useState(""); // Hidden field for bot detection
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const { toast } = useToast();
  
  // Track when form was first rendered (for timing-based bot detection)
  const formOpenedAt = useRef<number>(Date.now());
  const turnstileRef = useRef<TurnstileInstance>(null);
  const logSignupError = async (
    errorData: {
      email?: string;
      firstName?: string;
      lastName?: string;
      errorCode?: string;
      errorMessage?: string;
      errorDetails?: string;
    }
  ) => {
    try {
      // Log to database via edge function (server-side)
      await supabase.functions.invoke("notify-signup-error", {
        body: {
          email: errorData.email,
          firstName: errorData.firstName,
          lastName: errorData.lastName,
          errorCode: errorData.errorCode,
          errorMessage: errorData.errorMessage,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          logToDatabase: true,
        },
      });
    } catch (logError) {
      console.error("Failed to log signup error:", logError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName.trim()) return;
    
    // Require Turnstile verification
    if (!turnstileToken) {
      toast({
        title: "Verification required",
        description: "Please complete the security check.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    
    try {
      // Generate challenge for bot detection
      const challenge = generateChallenge(normalizedEmail);
      
      // Use edge function for server-side validation and rate limiting
      const { data, error } = await supabase.functions.invoke("early-access-signup", {
        body: {
          email: normalizedEmail,
          firstName: trimmedFirstName,
          lastName: trimmedLastName || null,
          honeypot: honeypot, // Send honeypot for bot detection
          turnstileToken: turnstileToken, // Cloudflare Turnstile token
        },
        headers: {
          "x-client-timestamp": formOpenedAt.current.toString(),
          "x-client-challenge": challenge,
        },
      });

      if (error) {
        throw error;
      }

      // Check for duplicate (server returns success but with duplicate flag)
      if (data?.duplicate) {
        toast({
          title: "Already aboard",
          description: "Welcome to the quiet harbor. You're already on our list.",
        });
        setSubmitted(true);
        return;
      }

      // Show success toast
      toast({
        title: "Welcome to the quiet harbor",
        description: "We will signal you soon.",
      });

      // Send notification email to admin (fire and forget - don't block user experience)
      supabase.functions.invoke("notify-signup", {
        body: {
          email: normalizedEmail,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          logoUrl: "https://i.imgur.com/nTpVGYt.png",
        },
      }).catch((err) => {
        console.error("Failed to send notification:", err);
      });
      // Clear fields and mark submitted
      setEmail("");
      setFirstName("");
      setLastName("");
      setThresholdAnswer("");
      setSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting email:", error);
      
      // Reset Turnstile on error so user can try again
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      
      // Log if not already logged (for non-Supabase errors)
      if (!error?.code) {
        await logSignupError({
          email: normalizedEmail,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          errorCode: "UNKNOWN",
          errorMessage: error?.message || "Unknown error",
          errorDetails: JSON.stringify(error),
        });
      }
      
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const parallaxOffset = useParallax(0.02);

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
    <section id="early-access" ref={sectionRef} className="section-padding bg-foreground/[0.03] dark:bg-background relative overflow-hidden scroll-mt-20">
      {/* Animated cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      
      {/* Parallax background layer with gold */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-gold/[0.04] via-transparent to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />
      
      {/* Central radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-gradient-radial from-gold/8 to-transparent pointer-events-none" />
      
      {/* Decorative gold border frame - enhanced */}
      <div className={`absolute inset-8 md:inset-16 rounded-3xl pointer-events-none transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}>
        <div className="absolute inset-0 border border-gold/15 rounded-3xl" />
        {/* Corner decorations */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 border-gold/40 rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-r-2 border-t-2 border-gold/40 rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-2 border-b-2 border-gold/40 rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-2 border-b-2 border-gold/40 rounded-br-lg" />
      </div>
      
      {/* Orbital rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[200, 300, 400].map((size, i) => (
          <div
            key={size}
            className={`absolute rounded-full border border-gold/5 ${isVisible ? 'animate-orbital-pulse' : 'opacity-0'}`}
            style={{
              width: size,
              height: size,
              left: -size / 2,
              top: -size / 2,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${6 + i * 2}s`,
            }}
          />
        ))}
      </div>
      
      <div className="container-narrow relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Enhanced header */}
          <p
            className={`text-xs uppercase tracking-[0.4em] text-gold/80 mb-6 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 animate-chromatic-shimmer" : "opacity-0"
            }`}
          >
            ◇ Initiate The Protocol ◇
          </p>
          <h2
            className={`text-4xl md:text-5xl font-serif mb-6 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-holographic">Founding</span>{" "}
            <span className="text-foreground">Members Program</span>
          </h2>
          <p
            className={`text-muted-foreground mb-4 leading-relaxed text-lg transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            The first <span className="text-gold font-semibold">100 verified contributors</span> will receive a permanent 
            <span className="text-gold font-semibold"> 1.5× trust coefficient</span> — reputation capital that compounds over time.
          </p>

          {/* Compound Effect Explanation */}
          <p
            className={`text-sm text-muted-foreground/70 mb-6 max-w-lg mx-auto transition-all duration-700 ease-out delay-[220ms] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            In practice: your first review carries the weight of a regular user's <span className="text-gold/80 font-medium">third review</span>. 
            After 10 contributions, your signal mass equals a non-founder's <span className="text-gold/80 font-medium">30+ contributions</span>. 
            Early trust compounds — like interest, but for credibility.
          </p>

          {/* Seats Progress Bar */}
          <div
            className={`max-w-sm mx-auto mb-8 transition-all duration-700 ease-out delay-[240ms] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-gold/60">Founding Seats</span>
              <span className="text-xs tabular-nums text-gold font-medium">37 / 100 claimed</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-[1500ms] ease-out ${
                  isVisible ? "w-[37%]" : "w-0"
                }`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-right">
              63 seats remaining — closing when full
            </p>
          </div>
          
          {/* Founding Member Benefits - Enhanced Scarcity */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-lg mx-auto transition-all duration-700 ease-out delay-250 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gold/30 bg-gold/10">
              <div className="w-8 h-8 rounded-full bg-gold/40 flex items-center justify-center">
                <span className="text-sm font-bold text-gold">★</span>
              </div>
              <span className="text-xs text-gold font-medium text-center">Founding Badge</span>
              <span className="text-[10px] text-muted-foreground">Permanent — visible on all reviews</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gold/20 bg-gold/5">
              <span className="text-lg font-mono text-gold font-bold">1.5×</span>
              <span className="text-xs text-foreground/80 text-center">Trust Multiplier</span>
              <span className="text-[10px] text-muted-foreground">Compounds with every review</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gold/20 bg-gold/5">
              <span className="text-lg font-mono text-gold font-bold">90d</span>
              <span className="text-xs text-foreground/80 text-center">Incubation Shield</span>
              <span className="text-[10px] text-muted-foreground">Protected growth period</span>
            </div>
          </div>

          {/* Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
              {/* Honeypot field - hidden from users, bots will fill it */}
              <div className="hidden" aria-hidden="true">
                <Input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              
              {/* Threshold question - gating */}
              <div className={`p-4 rounded-xl border border-gold/20 bg-gold/5 text-left transition-all duration-700 ease-out delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}>
                <p className="text-xs uppercase tracking-widest text-gold/70 mb-2">
                  Threshold Question
                </p>
                <p className="text-sm text-foreground/80 mb-3 font-serif italic">
                  "In a world where entropy is free, what makes order expensive?"
                </p>
                <Input
                  type="text"
                  placeholder="Your reflection..."
                  value={thresholdAnswer}
                  onChange={(e) => setThresholdAnswer(e.target.value)}
                  className="h-10 rounded-lg bg-background/50 border-gold/20 focus:border-gold/50 text-sm"
                  required
                  minLength={10}
                  maxLength={500}
                />
                <p className="text-[10px] text-muted-foreground/50 mt-2">
                  Minimum 10 characters. There is no wrong answer—only revealing ones.
                </p>
              </div>

              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 rounded-xl bg-background border-border focus:border-gold/50 flex-1"
                  required
                  maxLength={100}
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 rounded-xl bg-background border-border focus:border-gold/50 flex-1"
                  maxLength={100}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-background border-border focus:border-gold/50 flex-1"
                  required
                  maxLength={254}
                />
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="shrink-0" 
                  disabled={isLoading || !turnstileToken || thresholdAnswer.length < 10}
                >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Apply
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              
              {/* Cloudflare Turnstile CAPTCHA */}
              <div className="flex justify-center mt-4">
                <TurnstileWrapper
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setTurnstileError(false);
                  }}
                  onError={() => {
                    setTurnstileError(true);
                    setTurnstileToken(null);
                  }}
                  onExpire={() => {
                    setTurnstileToken(null);
                  }}
                  options={{
                    theme: "dark",
                    size: "normal",
                  }}
                />
              </div>
              {turnstileError && (
                <p className="text-sm text-destructive text-center">
                  Security check failed. Please refresh and try again.
                </p>
              )}
            </form>
          ) : (
            <div className={`flex flex-col items-center gap-6 animate-dramatic-entrance`}>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center animate-radial-pulse">
                  <Check className="w-8 h-8 text-gold" />
                </div>
                {/* Orbital rings */}
                <div className="absolute inset-0 rounded-full border border-gold/20 animate-orbital-pulse" style={{ animationDuration: '3s' }} />
              </div>
              <span className="text-2xl font-serif text-holographic">
                Application Received
              </span>
              <p className="text-muted-foreground max-w-sm">
                The protocol has noted your reflection. Your entry into the matrix awaits verification.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold/40" />
                <span className="text-gold/60">◆</span>
                <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold/40" />
              </div>
            </div>
          )}

          {/* Small note - enhanced with spam-free promise */}
          <div className="mt-12 space-y-2">
            <p className="text-xs text-muted-foreground/60">
              🔒 No spam. Only notified when your region launches.
            </p>
            <p className="text-xs text-muted-foreground/40 uppercase tracking-[0.3em]">
              Access is privilege, not entitlement
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EarlyAccess;
