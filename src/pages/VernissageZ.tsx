import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/ThemeToggle";
import BlackPalaceProtocol from "@/components/BlackPalaceProtocol";
import CelestialPivot from "@/components/CelestialPivot";
import StrategicFlowchart from "@/components/StrategicFlowchart";

// Countdown hook
const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

const VernissageZ = () => {
  // February 2, 2026, Stockholm time (CET/CEST)
  const eventDate = new Date("2026-02-02T18:00:00+01:00");
  const { days, hours, minutes, seconds } = useCountdown(eventDate);
  return (
    <div className="min-h-screen bg-background dark:bg-[hsl(220,15%,4%)]">
      {/* Header with gold accent */}
      <header className="border-b border-border/40 dark:border-gold/10 bg-background/95 dark:bg-[hsl(220,15%,4%)]/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="w-9" /> {/* Spacer for balance */}
          <span className="font-serif text-lg dark:text-gold/90">Vernissage Z</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section - Monolith Black Gold */}
      <section className="relative py-32 md:py-48 overflow-hidden bg-gradient-to-b from-gold/5 via-background to-background dark:from-gold/10 dark:via-[hsl(220,15%,4%)] dark:to-[hsl(220,15%,4%)]">
        {/* Gold-tinted matrix grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
          backgroundImage: `linear-gradient(hsl(var(--gold) / 0.4) 1px, transparent 1px), 
                            linear-gradient(90deg, hsl(var(--gold) / 0.4) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
        
        {/* Animated gold glows */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary gold glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 dark:bg-gold/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/8 dark:bg-gold/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          {/* Central gold ambient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/3 dark:bg-gold/8 rounded-full blur-[100px]" />
        </div>
        
        {/* Decorative gold corner frames */}
        <div className="absolute top-8 left-8 w-24 h-24 border-l-2 border-t-2 border-gold/20 dark:border-gold/30" />
        <div className="absolute top-8 right-8 w-24 h-24 border-r-2 border-t-2 border-gold/20 dark:border-gold/30" />
        <div className="absolute bottom-8 left-8 w-24 h-24 border-l-2 border-b-2 border-gold/20 dark:border-gold/30" />
        <div className="absolute bottom-8 right-8 w-24 h-24 border-r-2 border-b-2 border-gold/20 dark:border-gold/30" />
        
        {/* Horizontal gold ritual lines */}
        <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Pre-title badge with gold */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 dark:bg-gold/5 border border-gold/30 dark:border-gold/40 rounded-full mb-8 shadow-md shadow-gold/10 dark:shadow-lg dark:shadow-gold/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold dark:shadow-[0_0_8px_2px] dark:shadow-gold/60"></span>
              </span>
              <span className="text-sm font-medium text-gold">Stockholm · Feb 2, 2026</span>
            </motion.div>

            {/* Main Title with gold shimmer */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
            >
              <span className="bg-gradient-to-r from-foreground via-gold to-foreground bg-clip-text text-transparent bg-[length:200%_100%] animate-gold-shimmer">
                Vernissage Z
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-2xl md:text-3xl lg:text-4xl font-light text-muted-foreground dark:text-gold/60 mb-8"
            >
              The Art of Logic
            </motion.p>

            {/* Announcement teaser with gold border */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="inline-block p-6 bg-gradient-to-br from-background via-background to-gold/5 dark:from-[hsl(220,15%,6%)] dark:via-[hsl(220,15%,6%)] dark:to-gold/10 backdrop-blur-sm border border-gold/20 dark:border-gold/30 rounded-2xl shadow-2xl shadow-gold/15 dark:shadow-gold/30"
            >
              <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground dark:text-gold/50 mb-2">
                Official Rebranding Announcement
              </p>
              <p className="text-xl md:text-2xl font-serif">
                Z → <span className="text-gold font-semibold">Buoyancis</span>
              </p>
            </motion.div>

            {/* Countdown Timer with gold */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="mt-12"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-gold/50 mb-4">
                Event begins in
              </p>
              <div className="flex justify-center gap-3 md:gap-6">
                {[
                  { value: days, label: "Days" },
                  { value: hours, label: "Hours" },
                  { value: minutes, label: "Min" },
                  { value: seconds, label: "Sec" },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-background to-gold/5 dark:from-[hsl(220,15%,6%)] dark:to-gold/10 backdrop-blur-sm border border-gold/25 dark:border-gold/40 rounded-xl flex items-center justify-center shadow-lg shadow-gold/10 dark:shadow-xl dark:shadow-gold/30 dark:animate-glow-pulse">
                      <span className="font-mono text-2xl md:text-3xl font-bold text-gold">
                        {String(item.value).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground dark:text-gold/40 mt-2 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Event details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>February 2, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Stockholm, Sweden</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Private Event</span>
              </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="mt-16"
            >
              <div className="w-6 h-10 border-2 border-gold/30 dark:border-gold/40 rounded-full mx-auto flex justify-center">
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-1.5 h-1.5 bg-gold rounded-full mt-2"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Speech Content - Monolith aesthetic */}
      <section className="relative py-16 md:py-24 overflow-hidden dark:bg-[hsl(220,15%,4%)]">
        {/* Gold-tinted background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gold/5 to-transparent dark:from-gold/10" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gold/5 to-transparent dark:from-gold/10" />
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gold/5 dark:bg-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-gold/5 dark:bg-gold/10 rounded-full blur-3xl" />
        </div>
        <div className="container max-w-4xl relative">
          {/* Opening */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-gold/60 px-3 py-1 bg-gold/5 dark:bg-gold/10 rounded-full border border-gold/20 dark:border-gold/30">Opening</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">中文</p>
                <p className="text-lg leading-relaxed">
                  各位晚上好。欢迎来到斯德哥尔摩，欢迎来到 Vernissage Z。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  通常，"Vernissage" 是艺术品的预展。但今晚，我们展示的不是画作，而是<strong className="text-foreground">逻辑的艺术</strong>。
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">English</p>
                <p className="text-lg leading-relaxed">
                  Good evening. Welcome to Stockholm, and welcome to Vernissage Z.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Usually, a "Vernissage" is for art. But tonight, we are not unveiling paintings. We are unveiling <strong className="text-foreground">the Art of Logic</strong>.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Part 1: Pain Points & Vision */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-gold/60 px-3 py-1 bg-gold/5 dark:bg-gold/10 rounded-full border border-gold/20 dark:border-gold/30">Part I: The Fracture</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  我们生活在一个分裂的世界。东方和西方，除了怀疑，似乎什么都在减少。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  作为一名"工作狂"，我甚至愿意打五份工来换取五个愿望，但我发现，如果没有信任，所有的努力都将归零。
                </p>
                <p className="text-lg font-medium">
                  这就是为什么我建立了这个项目。
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We live in a fractured world. Between the East and the West, everything seems to be shrinking—except suspicion.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  As a workaholic, I would gladly work five jobs to fulfill five wishes. But I realized: without Trust, all effort multiplies by zero.
                </p>
                <p className="text-lg font-medium">
                  That is why I built this protocol.
                </p>
              </div>
            </div>

            {/* Formula Highlight with gold */}
            <div className="mt-10 p-8 bg-gradient-to-br from-gold/5 via-gold/10 to-gold/5 dark:from-gold/10 dark:via-gold/15 dark:to-gold/10 rounded-2xl text-center border border-gold/20 dark:border-gold/40 shadow-lg shadow-gold/10 dark:shadow-gold/30">
              <p className="font-mono text-2xl md:text-3xl text-gold">
                Effort × Trust = Value
              </p>
              <p className="text-sm text-muted-foreground dark:text-gold/50 mt-3">
                When Trust = 0, Value = 0
              </p>
            </div>
          </motion.div>

          {/* Part 2: Mathematical Solution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-gold/60 px-3 py-1 bg-gold/5 dark:bg-gold/10 rounded-full border border-gold/20 dark:border-gold/30">Part II: The Equation</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  我不相信单纯的人性，但我相信爱因斯坦，我相信数学。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  请看这个公式。这是<strong className="text-foreground">安全网协议 (SNP)</strong>。这不是虚无缥缈的承诺，这是算法层面的问责制。
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  I don't blindly trust human nature. But I trust Einstein. I trust Math.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Look at this equation. This is the <strong className="text-foreground">Safety Net Protocol (SNP)</strong>. It's not a vague promise; it is algorithmic accountability.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Part 3: The Rebranding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-gold/60 px-3 py-1 bg-gold/5 dark:bg-gold/10 rounded-full border border-gold/20 dark:border-gold/30">Part III: The Name</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  有些人问我，为什么要叫 "Vernissage Z"？
                </p>
                <p className="text-muted-foreground leading-relaxed">
269:                   "Z" 代表我的姓 (Zhang)，也代表 Zero Trust (零信任架构)。
270:                 </p>
                <p className="text-muted-foreground leading-relaxed">
                  在这个动荡的时代，符号可能会被误读。我们不需要更多的误解，我们需要的是浮力。
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Some asked, why "Vernissage Z"?
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  "Z" stood for my name, and for Zero Trust—the cybersecurity principle that assumes nothing is safe by default.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  In these turbulent times, symbols can be misunderstood. We don't need more misunderstanding. We need buoyancy.
                </p>
              </div>
            </div>

            {/* Announcement Box with gold */}
            <div className="relative p-8 md:p-12 bg-gradient-to-br from-gold/5 via-gold/10 to-gold/5 dark:from-gold/10 dark:via-gold/20 dark:to-gold/10 border border-gold/30 dark:border-gold/50 rounded-2xl text-center shadow-xl shadow-gold/15 dark:shadow-gold/40 overflow-hidden dark:animate-glow-pulse">
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-gold/40 dark:border-gold/60 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-gold/40 dark:border-gold/60 rounded-br-2xl" />
              <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-gold/20 dark:border-gold/30 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-gold/20 dark:border-gold/30 rounded-bl-2xl" />
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground dark:text-gold/50 mb-4">
                Official Announcement
              </p>
              <p className="font-serif text-3xl md:text-4xl mb-4">
                "Z" was just the code name.
              </p>
              <p className="text-xl md:text-2xl text-muted-foreground dark:text-gold/60 mb-6">
                Our official global name is
              </p>
              <p className="font-serif text-4xl md:text-5xl text-gold mb-6 drop-shadow-sm dark:drop-shadow-[0_0_15px_hsl(var(--gold)/0.5)]">
                Buoyancis
              </p>
              <p className="text-muted-foreground dark:text-gold/40 max-w-xl mx-auto">
                The mechanism that keeps assets—East and West—afloat, even in a storm.
              </p>
            </div>
          </motion.div>

          {/* Closing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-gold/60 px-3 py-1 bg-gold/5 dark:bg-gold/10 rounded-full border border-gold/20 dark:border-gold/30">Closing: The Toast</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  为了实现这一点，我设计了 <strong className="text-foreground">50/50 的全球架构</strong>。一半东方，一半西方。绝对的平衡。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Donnie, Rick, Johan，这就是为什么我需要你们。我带来了代码，而你们带来了桥梁。
                </p>
                <p className="text-lg font-medium">
                  让我们为 Buoyancis 干杯。
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  To make this work, I designed a <strong className="text-foreground">50/50 Global Structure</strong>. Half East, Half West. Absolute equilibrium.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Donnie, Rick, Johan—this is why I saw potential in you. I brought the code; you bring the bridge.
                </p>
                <p className="text-lg font-medium">
                  Let's toast to Buoyancis.
                </p>
              </div>
            </div>

            {/* 50/50 Visual with gold */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-6 bg-gradient-to-br from-gold/5 to-gold/10 dark:from-gold/10 dark:to-gold/15 rounded-xl text-center border border-gold/20 dark:border-gold/30 shadow-lg shadow-gold/5 dark:shadow-gold/10">
                <p className="text-3xl font-serif text-gold mb-2">50%</p>
                <p className="text-sm text-muted-foreground dark:text-gold/50">East</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-gold/10 to-gold/20 dark:from-gold/15 dark:to-gold/25 rounded-xl text-center border border-gold/30 dark:border-gold/50 shadow-lg shadow-gold/10 dark:shadow-gold/20">
                <p className="text-3xl font-serif text-gold mb-2">50%</p>
                <p className="text-sm text-muted-foreground dark:text-gold/50">West</p>
              </div>
            </div>
          </motion.div>

          <Separator className="my-16 bg-gold/20" />

          {/* Footer Quote with gold */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <blockquote className="font-serif text-2xl md:text-3xl italic text-muted-foreground dark:text-gold/70 mb-6">
              "熵增是必然的。结构是一种选择。"
            </blockquote>
            <p className="text-muted-foreground dark:text-gold/50">
              Entropy is inevitable. Structure is a choice.
            </p>
            
            <div className="mt-12">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-gold hover:bg-gold/90 text-background dark:shadow-lg dark:shadow-gold/30">
                <Link to="/home">
                  Enter Buoyancis →
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Celestial Pivot - Imperial System */}
      <CelestialPivot />

      {/* Strategic Flowchart - Connecting Operations to Strategy */}
      <StrategicFlowchart />

      {/* The Black Palace Protocol - Classified Document */}
      <BlackPalaceProtocol />

      {/* Simple Footer with gold accent */}
      <footer className="border-t border-gold/20 dark:border-gold/30 py-8 dark:bg-[hsl(220,15%,4%)]">
        <div className="container text-center text-sm text-muted-foreground dark:text-gold/40">
          <p>© 2026 Buoyancis. Structure in motion.</p>
        </div>
      </footer>
    </div>
  );
};

export default VernissageZ;
