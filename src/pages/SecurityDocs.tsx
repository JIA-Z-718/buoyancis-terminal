import { useState, useCallback } from "react";
import { 
  Shield, 
  Clock, 
  Bot, 
  Globe, 
  Lock, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  Eye,
  Fingerprint,
  Timer,
  Ban,
  FileText,
  Download,
  FileSearch,
  List
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecurityStatusDashboard from "@/components/security/SecurityStatusDashboard";
import SecurityLayerTrends from "@/components/admin/SecurityLayerTrends";
import { TrendingUp } from "lucide-react";
import PrintPreview from "@/components/PrintPreview";
import { usePrintPreviewShortcut } from "@/hooks/usePrintPreviewShortcut";

const tocItems = [
  { id: "overview", label: "Security Overview", icon: Shield },
  { id: "protection-layers", label: "Protection Layers", icon: Lock },
  { id: "database-security", label: "Database Security", icon: Database },
  { id: "attack-response", label: "Attack Response Flow", icon: AlertTriangle },
];

interface SecurityLayerProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

function SecurityLayer({ icon, title, description, details, badge, badgeVariant = "default" }: SecurityLayerProps) {
  return (
    <Card className="border-border/50 print:shadow-none print:border-gray-300 print:break-inside-avoid">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary print:bg-gray-100">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          {badge && (
            <Badge variant={badgeVariant}>{badge}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {details.map((detail, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function SecurityDocs() {
  const [showPreview, setShowPreview] = useState(false);
  
  const openPreview = useCallback(() => setShowPreview(true), []);
  usePrintPreviewShortcut(openPreview);

  const securityLayers: SecurityLayerProps[] = [
    {
      icon: <Timer className="w-5 h-5" />,
      title: "Rate Limiting with Exponential Backoff",
      description: "Progressive throttling system that escalates penalties for repeat offenders",
      badge: "Layer 1",
      details: [
        "Base limit: 5 requests per minute per IP address",
        "Exponential backoff: lockout duration doubles with each violation (1min → 2min → 4min → 8min...)",
        "All violations logged to rate_limit_violations table for monitoring",
        "Real-time admin dashboard widget shows 7-day trend and function breakdown"
      ]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Cloudflare Turnstile CAPTCHA",
      description: "Invisible challenge-response verification to distinguish humans from bots",
      badge: "Layer 2",
      details: [
        "Server-side token verification via Cloudflare Turnstile API",
        "Invisible mode provides frictionless UX for legitimate users",
        "Failed verifications logged as 'captcha_failed' events in bot_detection_events",
        "Blocks automated form submission tools and headless browsers"
      ]
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Honeypot Field Detection",
      description: "Hidden form fields that trap automated bots",
      badge: "Layer 3",
      details: [
        "Invisible 'website' field added to signup form",
        "Legitimate users never see or fill this field",
        "Any submission with honeypot data triggers immediate silent rejection",
        "Bots receive fake 'success' response to prevent adaptation"
      ]
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Timing-Based Detection",
      description: "Analyzes submission speed to identify automated behavior",
      badge: "Layer 4",
      details: [
        "Minimum threshold: 2 seconds between page load and submission",
        "Human typing patterns require realistic time to complete form",
        "Instant submissions flagged as 'timing_violation' events",
        "Silent rejection with fake success prevents bot learning"
      ]
    },
    {
      icon: <Bot className="w-5 h-5" />,
      title: "User-Agent Filtering",
      description: "Identifies and blocks known bot signatures and suspicious patterns",
      badge: "Layer 5",
      details: [
        "Blocks known bot User-Agents (curl, wget, python-requests, etc.)",
        "Detects headless browser signatures (HeadlessChrome, PhantomJS)",
        "Flags empty or malformed User-Agent strings",
        "Logged as 'suspicious_user_agent' events for analysis"
      ]
    },
    {
      icon: <Fingerprint className="w-5 h-5" />,
      title: "JavaScript Hash Challenge",
      description: "Client-side proof-of-work verification via x-client-challenge header",
      badge: "Layer 6",
      details: [
        "Browser must compute and submit SHA-256 hash challenge",
        "Verifies JavaScript execution capability (blocks simple HTTP clients)",
        "Missing or invalid challenge triggers 'missing_client_challenge' event",
        "Adds computational cost to automated attacks"
      ]
    },
    {
      icon: <Ban className="w-5 h-5" />,
      title: "IP Blocklist Management",
      description: "Dynamic blacklist of known malicious IP addresses",
      badge: "Layer 7",
      details: [
        "Admin-managed ip_blocklist table with custom block reasons",
        "Real-time lookup on every signup attempt",
        "Supports individual and bulk blocking from Bot Detection dashboard",
        "Block/unblock actions with confirmation dialogs to prevent accidents"
      ]
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Geographic Restrictions",
      description: "Country and region-based access controls",
      badge: "Layer 8",
      details: [
        "geo_restrictions table for blocking by country code or region",
        "IP geolocation lookup integrated into signup flow",
        "Admin dashboard for managing allowed/blocked countries",
        "Useful for compliance (GDPR) or blocking high-fraud regions"
      ]
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email Domain Validation",
      description: "Blocks disposable emails and suggests typo corrections",
      badge: "Layer 9",
      details: [
        "SPAM_EMAIL_DOMAINS list blocks known disposable/temporary email providers",
        "EMAIL_TYPO_MAP detects common typos (gmial.com → gmail.com)",
        "User-friendly error messages suggest corrections",
        "Violations logged as 'spam_domain' or 'typo_domain' events"
      ]
    }
  ];

  const databaseSecurityMeasures = [
    {
      title: "Row-Level Security (RLS)",
      items: [
        "early_access_signups: Public INSERT allowed (via Edge Function), SELECT/UPDATE/DELETE admin-only",
        "signup_error_logs: Client-side INSERT blocked via WITH CHECK (false), service role only",
        "bot_detection_events: Admin-only SELECT, service role INSERT for event logging",
        "rate_limit_violations: Admin-only access for monitoring dashboard"
      ]
    },
    {
      title: "Audit & Monitoring",
      items: [
        "All bot detection events stored with IP, User-Agent, and timestamps",
        "Rate limit violations tracked per function and IP address",
        "Real-time admin dashboard with trend charts and filtering",
        "World map visualization of geographic threat distribution"
      ]
    },
    {
      title: "Silent Failure Strategy",
      items: [
        "Detected bots receive fake 'success' responses",
        "Prevents attackers from learning detection patterns",
        "Actual submissions silently discarded server-side",
        "Reduces reconnaissance effectiveness"
      ]
    },
    {
      title: "Data Retention Policies",
      items: [
        "bot_detection_events: 90-day retention period",
        "rate_limit_violations: 30-day retention period",
        "signup_error_logs: 30-day retention period",
        "cron_failure_notifications: 30-day retention period",
        "Automated daily cleanup via cleanup-old-records Edge Function (3:00 AM UTC)"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header */}
      <header className="border-b bg-card print:bg-white print:border-gray-300">
        <div className="container mx-auto px-4 py-6 print:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground print:bg-gray-800">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Security Documentation</h1>
                <p className="text-muted-foreground">Early Access Signup Protection Measures</p>
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
                <Link to="/">Back to Home</Link>
              </Button>
            </div>

            <PrintPreview 
              isOpen={showPreview} 
              onClose={() => setShowPreview(false)} 
              title="Security Documentation"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="print:hidden">
            <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUp className="w-4 h-4 mr-1" />
              30-Day Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 print:hidden">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Real-Time Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Live monitoring of all 9 protection layers with real-time metrics and threat detection.
                </p>
                <SecurityStatusDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 print:hidden">
            <SecurityLayerTrends />
          </TabsContent>

          <TabsContent value="documentation" className="space-y-12 print:block">
            {/* Table of Contents */}
            <nav className="print:hidden">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Table of Contents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="flex items-center gap-2 p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </nav>

            {/* Overview */}
            <section id="overview" className="scroll-mt-24 print:break-inside-avoid">
              <Card className="bg-primary/5 border-primary/20 print:bg-gray-50 print:border-gray-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    The early access signup flow implements a comprehensive 9-layer security architecture 
                    designed to protect against automated attacks, spam, and abuse while maintaining a 
                    frictionless experience for legitimate users.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                    <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                      <div className="text-3xl font-bold text-primary print:text-gray-800">9</div>
                      <div className="text-sm text-muted-foreground">Protection Layers</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                      <div className="text-3xl font-bold text-primary print:text-gray-800">5/min</div>
                      <div className="text-sm text-muted-foreground">Rate Limit</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                      <div className="text-3xl font-bold text-primary print:text-gray-800">2s</div>
                      <div className="text-sm text-muted-foreground">Min Submit Time</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                      <div className="text-3xl font-bold text-primary print:text-gray-800">100%</div>
                      <div className="text-sm text-muted-foreground">RLS Coverage</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Protection Layers */}
            <section id="protection-layers" className="scroll-mt-24 print:break-before-page">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Protection Layers
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 print:block print:space-y-4">
                {securityLayers.map((layer, index) => (
                  <SecurityLayer key={index} {...layer} />
                ))}
              </div>
            </section>

            <Separator className="my-12 print:my-6" />

            {/* Database Security */}
            <section id="database-security" className="scroll-mt-24 print:break-before-page">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Security
              </h2>
              <div className="grid gap-6 md:grid-cols-2 print:block print:space-y-4">
                {databaseSecurityMeasures.map((measure, index) => (
                  <Card key={index} className="print:shadow-none print:border-gray-300 print:break-inside-avoid">
                    <CardHeader>
                      <CardTitle className="text-lg">{measure.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {measure.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <Separator className="my-12 print:my-6" />

            {/* Attack Response Flow */}
            <section id="attack-response" className="scroll-mt-24 print:break-inside-avoid">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Attack Response Flow
              </h2>
              <Card className="print:shadow-none print:border-gray-300">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <Badge variant="outline" className="shrink-0">Step 1</Badge>
                      <div>
                        <div className="font-medium">Request Received</div>
                        <div className="text-sm text-muted-foreground">
                          Edge Function receives signup request with IP, headers, and form data
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <Badge variant="outline" className="shrink-0">Step 2</Badge>
                      <div>
                        <div className="font-medium">Layer-by-Layer Validation</div>
                        <div className="text-sm text-muted-foreground">
                          Each protection layer evaluates the request in sequence (rate limit → CAPTCHA → honeypot → timing → etc.)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <Badge variant="outline" className="shrink-0">Step 3</Badge>
                      <div>
                        <div className="font-medium">Event Logging</div>
                        <div className="text-sm text-muted-foreground">
                          Any violation is logged to bot_detection_events or rate_limit_violations with full context
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Badge className="shrink-0 bg-green-500">Pass</Badge>
                      <div>
                        <div className="font-medium text-green-700 dark:text-green-400">Legitimate User</div>
                        <div className="text-sm text-muted-foreground">
                          Signup saved to early_access_signups, welcome email triggered
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <Badge variant="destructive" className="shrink-0">Fail</Badge>
                      <div>
                        <div className="font-medium text-red-700 dark:text-red-400">Detected Bot/Attack</div>
                        <div className="text-sm text-muted-foreground">
                          Silent fake "success" response returned, request discarded, event logged
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8 border-t mt-12 print:py-4 print:mt-6">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-2 print:hidden">
            For questions about security measures, contact the development team.
          </p>
        </footer>
      </main>
    </div>
  );
}
