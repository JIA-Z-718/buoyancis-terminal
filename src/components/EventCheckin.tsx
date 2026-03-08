import { useState } from "react";
import { motion } from "framer-motion";
import { Check, User, Mail, Phone, Building2, Loader2, QrCode, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import QRCodeDialog from "@/components/QRCodeDialog";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

interface CheckinFormData {
  full_name: string;
  email: string;
  phone: string;
  company: string;
}

const EventCheckin = () => {
  const [formData, setFormData] = useState<CheckinFormData>({
    full_name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error("請輸入您的姓名");
      return;
    }

    // Validate input lengths
    if (formData.full_name.length > 100) {
      toast.error("姓名不能超過 100 個字元");
      return;
    }

    if (formData.email && formData.email.length > 255) {
      toast.error("電子郵件不能超過 255 個字元");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Edge Function for secure check-in (bypasses RLS with service role)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-checkin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            full_name: formData.full_name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            company: formData.company.trim() || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Check-in error:", result.error);
        if (response.status === 429) {
          toast.error("請稍後再試，您的請求過於頻繁");
        } else {
          toast.error(result.error || "簽到失敗，請稍後再試");
        }
        return;
      }

      setIsCheckedIn(true);
      toast.success(`歡迎，${formData.full_name}！簽到成功`);
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("簽到失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      company: "",
    });
    setIsCheckedIn(false);
  };

  // Get the check-in URL for sharing
  const checkinUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/checkin` 
    : "/checkin";

  if (isCheckedIn) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/12 dark:bg-primary/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-10">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </Link>
            <span className="font-serif text-lg">Vernissage Z</span>
            <ThemeToggle />
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center p-4 pt-20 relative z-10"
        >
          <Card className="w-full max-w-md text-center bg-background/80 backdrop-blur-sm border-primary/20">
            <CardContent className="pt-8 pb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-serif font-bold mb-1">簽到成功！</h2>
              <p className="text-sm text-muted-foreground/70 mb-1">Check-in Successful</p>
              <p className="text-xs text-muted-foreground/50 mb-4">Incheckning lyckades</p>
              <p className="text-muted-foreground mb-6">
                歡迎 · Welcome · Välkommen, {formData.full_name}
              </p>
              
              {/* Enter Buoyancis CTA */}
              <Button asChild size="lg" className="w-full mb-6 text-lg">
                <Link to="/home" onClick={() => window.scrollTo(0, 0)}>
                  進入 · Enter · Gå in
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              {/* Share QR Code section */}
              <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">
                  邀請朋友一起簽到 · Invite friends
                </p>
                <p className="text-xs text-muted-foreground/70 mb-3">
                  Bjud in vänner att checka in
                </p>
                <QRCodeDialog
                  url={checkinUrl}
                  title="分享簽到連結 · Share · Dela länk"
                  description="掃描 QR Code 即可開啟簽到頁面 · Scan to open · Skanna för att öppna"
                >
                  <Button variant="secondary" size="sm" className="gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code · Visa
                  </Button>
                </QRCodeDialog>
              </div>

              <Button variant="outline" onClick={handleReset}>
                新增嘉賓 · Add Guest · Lägg till gäst
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements - matching Vernissage Z */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/12 dark:bg-primary/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        {/* Central ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
        {/* Accent color glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 dark:bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
        {/* Gradient overlays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent dark:from-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-muted/30 to-transparent dark:from-transparent" />
      </div>

      {/* Header - matching Vernissage Z */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </Link>
          <span className="font-serif text-lg">Vernissage Z</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-col items-center justify-center p-4 pt-12 md:pt-20 relative z-10">
        {/* Event badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-full mb-6 shadow-md shadow-primary/10 dark:shadow-lg dark:shadow-primary/20"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary dark:shadow-[0_0_8px_2px] dark:shadow-primary/60"></span>
          </span>
          <span className="text-sm font-medium text-primary">Stockholm · Feb 2, 2026</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-serif text-3xl md:text-4xl font-bold mb-2 text-center"
        >
          <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Guest Registration
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-muted-foreground mb-8 text-center"
        >
          The Art of Logic awaits
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="bg-background/80 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5 dark:shadow-primary/10">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9" />
                <div>
                  <CardTitle className="text-xl font-serif">活動簽到</CardTitle>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">Event Check-in · Incheckning</p>
                </div>
                <QRCodeDialog
                  url={checkinUrl}
                  title="分享簽到連結 · Share · Dela länk"
                  description="掃描 QR Code 即可開啟簽到頁面 · Scan to open · Skanna för att öppna"
                >
                  <Button variant="ghost" size="icon" className="h-9 w-9" title="顯示 QR Code · Visa QR">
                    <QrCode className="h-5 w-5" />
                  </Button>
                </QRCodeDialog>
              </div>
              <CardDescription>
                請填寫您的資料完成簽到
                <span className="block text-xs mt-0.5 opacity-70">Fill in your info · Fyll i dina uppgifter</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary/70" />
                    <span>姓名 <span className="text-muted-foreground/70 text-xs font-normal">Name · Namn</span></span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="請輸入您的姓名 / Your name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    autoFocus
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200 focus:shadow-md focus:shadow-primary/10"
                  />
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary/70" />
                    <span>電子郵件 <span className="text-muted-foreground/70 text-xs font-normal">Email · E-post</span></span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    maxLength={255}
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200 focus:shadow-md focus:shadow-primary/10"
                  />
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary/70" />
                    <span>電話號碼 <span className="text-muted-foreground/70 text-xs font-normal">Phone · Telefon</span></span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+46 70 123 4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={20}
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200 focus:shadow-md focus:shadow-primary/10"
                  />
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary/70" />
                    <span>公司/單位 <span className="text-muted-foreground/70 text-xs font-normal">Company · Företag</span></span>
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="您的公司或單位名稱 / Your company"
                    value={formData.company}
                    onChange={handleInputChange}
                    maxLength={100}
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200 focus:shadow-md focus:shadow-primary/10"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                >
                  <Button
                    type="submit"
                    className="w-full mt-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        簽到中 · Checking in · Checkar in...
                      </>
                    ) : (
                      <>
                        確認簽到 · Confirm · Bekräfta
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Decorative quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 text-sm text-muted-foreground/60 italic text-center max-w-sm"
        >
          "Entropy is inevitable. Structure is a choice."
        </motion.p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 border-t border-border/40 py-4 bg-background/80 backdrop-blur-sm z-10">
        <div className="container text-center text-xs text-muted-foreground">
          <p>© 2026 Buoyancis. Structure in motion.</p>
        </div>
      </footer>
    </div>
  );
};

export default EventCheckin;
