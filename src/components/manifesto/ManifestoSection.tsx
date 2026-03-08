import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";
import { z } from "zod";

// UI translations for ManifestoSection
const translations = {
  en: {
    quote1: "The internet is a sea of entropy.",
    quote2: "Without a conscious observer, truth remains in superposition.",
    quote3: "Buoyancis collapses the noise. The signal emerges.",
    attribution: "— The Consciousness Field Protocol",
    joinOrder: "Enter the Field",
    placeholder: "your@email.com",
    initiated: "Frequency Registered",
    alreadyMember: "Already Resonating",
    alreadyMemberDesc: "Your waveform is already entangled.",
    somethingWrong: "Field disruption. Please retry.",
    emailRequired: "Email is required",
    invalidEmail: "Please enter a valid email",
    emailTooLong: "Email is too long",
    footerNote: "0 → ψ → Ω (Void → Wave Function → Collapsed Truth)",
  },
  zh: {
    quote1: "互聯網是熵的海洋。",
    quote2: "沒有意識觀測者，真理永遠處於疊加態。",
    quote3: "Buoyancis 塌縮雜訊。信號浮現。",
    attribution: "—— 意識場協議",
    joinOrder: "進入場域",
    placeholder: "你的@郵箱.com",
    initiated: "頻率已註冊",
    alreadyMember: "已在共振",
    alreadyMemberDesc: "你的波形已糾纏。",
    somethingWrong: "場域擾動，請重試。",
    emailRequired: "請輸入電子郵件",
    invalidEmail: "請輸入有效的電子郵件",
    emailTooLong: "電子郵件過長",
    footerNote: "0 → ψ → Ω (虛空 → 波函數 → 塌縮真理)",
  },
  ja: {
    quote1: "インターネットはエントロピーの海である。",
    quote2: "意識的観測者なしに、真実は重ね合わせのままである。",
    quote3: "Buoyancisはノイズを崩壊させる。シグナルが現れる。",
    attribution: "—— 意識場プロトコル",
    joinOrder: "場に入る",
    placeholder: "your@email.com",
    initiated: "周波数登録完了",
    alreadyMember: "既に共鳴中",
    alreadyMemberDesc: "あなたの波形は既に絡み合っています。",
    somethingWrong: "場の乱れ。再試行してください。",
    emailRequired: "メールアドレスを入力してください",
    invalidEmail: "有効なメールアドレスを入力してください",
    emailTooLong: "メールアドレスが長すぎます",
    footerNote: "0 → ψ → Ω (虚無 → 波動関数 → 崩壊した真実)",
  },
  ko: {
    quote1: "인터넷은 엔트로피의 바다이다.",
    quote2: "의식적 관찰자 없이, 진실은 중첩 상태에 머문다.",
    quote3: "Buoyancis는 노이즈를 붕괴시킨다. 신호가 나타난다.",
    attribution: "—— 의식장 프로토콜",
    joinOrder: "장에 진입",
    placeholder: "your@email.com",
    initiated: "주파수 등록됨",
    alreadyMember: "이미 공명 중",
    alreadyMemberDesc: "파동이 이미 얽혀 있습니다.",
    somethingWrong: "장 교란. 다시 시도하세요.",
    emailRequired: "이메일을 입력해주세요",
    invalidEmail: "유효한 이메일을 입력해주세요",
    emailTooLong: "이메일이 너무 깁니다",
    footerNote: "0 → ψ → Ω (공허 → 파동함수 → 붕괴된 진실)",
  },
};

const ManifestoSection = () => {
  const { language } = useDecoderLanguage();
  const t = translations[language];
  
  const emailSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: t.emailRequired })
      .email({ message: t.invalidEmail })
      .max(254, { message: t.emailTooLong }),
  });

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "early-access-signup",
        {
          body: {
            email: normalizedEmail,
            firstName: "Order",
            lastName: "Member",
            honeypot: "",
            turnstileToken: null,
          },
        }
      );

      if (fnError) {
        throw fnError;
      }

      if (data?.duplicate) {
        toast({
          title: t.alreadyMember,
          description: t.alreadyMemberDesc,
        });
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(t.somethingWrong);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-black relative overflow-hidden">
      {/* Quantum wave background effect */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(212, 175, 55, 0)" />
              <stop offset="50%" stopColor="rgba(212, 175, 55, 0.5)" />
              <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
            </linearGradient>
          </defs>
          {[0.3, 0.4, 0.5, 0.6, 0.7].map((y, i) => (
            <path
              key={i}
              d={`M0,${y * 100}% Q25%,${(y - 0.1) * 100}% 50%,${y * 100}% T100%,${y * 100}%`}
              fill="none"
              stroke="url(#wave-gradient)"
              strokeWidth="1"
              className="animate-energy-wave"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </svg>
      </div>
      
      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Core manifesto statement */}
        <div className="mb-16">
          <div className="w-px h-16 bg-gold/30 mx-auto mb-12" />
          
          <blockquote className="text-xl md:text-3xl font-light text-white/90 leading-relaxed tracking-wide mb-4">
            "{t.quote1}"
          </blockquote>
          
          <blockquote className="text-xl md:text-3xl font-light text-white/70 leading-relaxed tracking-wide mb-4">
            "{t.quote2}"
          </blockquote>
          
          <blockquote className="text-2xl md:text-4xl font-medium text-gold leading-relaxed tracking-wide mb-8">
            "{t.quote3}"
          </blockquote>
          
          <p className="text-gold/50 text-sm uppercase tracking-[0.3em] font-mono">
            {t.attribution}
          </p>
          
          <div className="w-px h-16 bg-gold/30 mx-auto mt-12" />
        </div>

        {/* Subscription form */}
        <div className="max-w-md mx-auto">
          {submitted ? (
            <div className="flex items-center justify-center gap-3 py-4 animate-fade-in">
              <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-white/80" />
              </div>
              <span className="text-white/60 font-mono text-sm uppercase tracking-widest">
                {t.initiated}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-mono mb-6">
                {t.joinOrder}
              </p>
              
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder={t.placeholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="flex-1 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm focus:border-white/30 focus:ring-0"
                  required
                  maxLength={254}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-6 bg-white text-black hover:bg-white/90 font-mono text-sm uppercase tracking-wider"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {error && (
                <p className="text-red-400/80 text-xs font-mono text-center">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-16 text-white/20 text-xs font-mono">
          {t.footerNote}
        </p>
      </div>
    </section>
  );
};

export default ManifestoSection;
