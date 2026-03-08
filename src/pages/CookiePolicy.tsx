import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Cookie, Settings, Shield, Clock, ToggleLeft, Download, FileSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PrintPreview from "@/components/PrintPreview";
import TableOfContents, { TocItem } from "@/components/TableOfContents";
import BackToTopButton from "@/components/BackToTopButton";
import CookiePreferencesModal from "@/components/CookiePreferencesModal";
import { usePrintPreviewShortcut } from "@/hooks/usePrintPreviewShortcut";

const tocItems: TocItem[] = [
  { id: "what-are-cookies", title: "What Are Cookies", level: 2 },
  { id: "cookies-we-use", title: "Cookies We Use", level: 2 },
  { id: "essential-cookies", title: "Essential Cookies", level: 3 },
  { id: "functional-cookies", title: "Functional Cookies", level: 3 },
  { id: "your-choices", title: "Your Choices", level: 2 },
  { id: "browser-settings", title: "Browser Settings", level: 2 },
  { id: "updates", title: "Updates to This Policy", level: 2 },
  { id: "contact", title: "Contact Us", level: 2 },
];

interface CookieInfo {
  name: string;
  purpose: string;
  duration: string;
  type: "essential" | "functional";
}

const cookiesUsed: CookieInfo[] = [
  {
    name: "sb-*-auth-token",
    purpose: "Maintains your authentication session when logged in",
    duration: "Session / 1 week",
    type: "essential",
  },
  {
    name: "cookie-consent",
    purpose: "Remembers your cookie preference choice",
    duration: "1 year",
    type: "essential",
  },
  {
    name: "supabase.auth.token",
    purpose: "Stores authentication state for secure API requests",
    duration: "Session",
    type: "essential",
  },
];

export default function CookiePolicy() {
  const [showPreview, setShowPreview] = useState(false);
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
  const lastUpdated = "January 26, 2026";

  const openPreview = useCallback(() => setShowPreview(true), []);
  usePrintPreviewShortcut(openPreview);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header */}
      <header className="border-b bg-card print:bg-white print:border-gray-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground print:bg-gray-800">
                <Cookie className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Cookie Policy</h1>
                <p className="text-muted-foreground">How we use cookies and your preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setShowPreview(true)}>
                      <FileSearch className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Preview document <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+P</kbd></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <PrintPreview 
              isOpen={showPreview} 
              onClose={() => setShowPreview(false)} 
              title="Cookie Policy"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        {/* Table of Contents Sidebar */}
        <TableOfContents items={tocItems} className="print:hidden" />

        <main className="flex-1 max-w-4xl">
          {/* Last Updated */}
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: {lastUpdated}
          </p>

          {/* Introduction */}
          <section className="mb-10">
            <p className="text-muted-foreground leading-relaxed">
              This Cookie Policy explains how we use cookies and similar technologies on our website. 
              We believe in transparency and want you to understand exactly what data is stored in your 
              browser and why. Our approach is minimal—we only use cookies that are necessary for the 
              site to function properly.
            </p>
          </section>

          <Separator className="my-8" />

          {/* What Are Cookies */}
          <section id="what-are-cookies" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Cookie className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">What Are Cookies</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                Cookies are small text files that websites store on your device (computer, tablet, or mobile) 
                when you visit them. They serve various purposes, from remembering your login status to 
                understanding how you interact with a site.
              </p>
              <p>
                Cookies can be "session cookies" that are deleted when you close your browser, or "persistent 
                cookies" that remain on your device for a set period or until you delete them manually.
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Cookies We Use */}
          <section id="cookies-we-use" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Cookies We Use</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground mb-6">
              <p>
                We take a minimal approach to cookies. We do not use any third-party advertising, 
                analytics, or tracking cookies. The cookies we use are strictly necessary for the 
                website to function or to remember your explicit preferences.
              </p>
            </div>

            {/* Essential Cookies */}
            <div id="essential-cookies" className="mb-8 scroll-mt-24">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Essential Cookies
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                These cookies are required for the website to function. They cannot be disabled 
                as the site would not work properly without them.
              </p>
              
              <div className="space-y-3">
                {cookiesUsed.filter(c => c.type === "essential").map((cookie) => (
                  <Card key={cookie.name} className="print:shadow-none print:border-gray-300">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                              {cookie.name}
                            </code>
                            <Badge variant="secondary" className="text-xs">Essential</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{cookie.purpose}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {cookie.duration}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Functional Cookies */}
            <div id="functional-cookies" className="scroll-mt-24">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ToggleLeft className="w-4 h-4 text-primary" />
                Functional Cookies
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                We currently do not use any functional cookies beyond those listed as essential. 
                If we introduce optional cookies in the future, they will be listed here and you 
                will be able to opt out of them.
              </p>
              
              <Card className="bg-muted/50 print:shadow-none print:border-gray-300">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No optional functional cookies are currently in use.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Your Choices */}
          <section id="your-choices" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <ToggleLeft className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Your Choices</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                When you first visit our site, you'll see a cookie consent banner. Your options are:
              </p>
              <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                <Card className="print:shadow-none print:border-gray-300">
                  <CardContent className="pt-4">
                    <h3 className="font-medium text-foreground mb-2">Accept</h3>
                    <p className="text-sm">
                      Allows essential cookies to function. Your preference is saved so you 
                      won't see the banner again for one year.
                    </p>
                  </CardContent>
                </Card>
                <Card className="print:shadow-none print:border-gray-300">
                  <CardContent className="pt-4">
                    <h3 className="font-medium text-foreground mb-2">Decline</h3>
                    <p className="text-sm">
                      We respect your choice. However, essential cookies required for basic 
                      functionality (like authentication) will still be used.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <p className="text-sm mb-4">
                You can change your preference at any time by using the button below, clearing your 
                browser cookies and revisiting the site, or by adjusting your browser settings.
              </p>
              <Button onClick={() => setShowCookiePreferences(true)} className="print:hidden">
                <Settings className="w-4 h-4 mr-2" />
                Manage Cookie Preferences
              </Button>
            </div>
          </section>

          <CookiePreferencesModal 
            isOpen={showCookiePreferences} 
            onClose={() => setShowCookiePreferences(false)} 
          />

          <Separator className="my-8" />

          {/* Browser Settings */}
          <section id="browser-settings" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Browser Settings</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <div className="grid gap-3">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>View what cookies are stored on your device</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Delete all or specific cookies</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Block all cookies or only third-party cookies</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Set your browser to notify you when a cookie is being set</p>
                </div>
              </div>
              <p className="text-sm mt-4">
                Note: Blocking essential cookies may prevent you from using certain features of our 
                site, such as logging in or maintaining your session.
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Updates */}
          <section id="updates" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Updates to This Policy</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or for legal, operational, or regulatory reasons. When we make changes, we will update 
                the "Last updated" date at the top of this page.
              </p>
              <p>
                For significant changes that affect your rights or how we use cookies, we will provide 
                more prominent notice, such as displaying a banner on our website.
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Contact */}
          <section id="contact" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Cookie className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Contact Us</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have any questions about our use of cookies or this Cookie Policy, please 
                don't hesitate to contact us. We're committed to addressing your concerns.
              </p>
              <p className="text-sm">
                For privacy-related inquiries, please see our{" "}
                <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </section>

          {/* Related Links */}
          <Card className="bg-muted/50 print:shadow-none print:border-gray-300">
            <CardHeader>
              <CardTitle className="text-base">Related Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/legal/privacy">Privacy Policy</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/legal/terms">Terms of Service</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/tools/security">Security Documentation</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <BackToTopButton />
    </div>
  );
}
