import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Database, Mail, Clock, Eye, Lock, UserX, Globe, Download, FileSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PrintPreview from "@/components/PrintPreview";
import TableOfContents, { TocItem } from "@/components/TableOfContents";
import BackToTopButton from "@/components/BackToTopButton";
import { usePrintPreviewShortcut } from "@/hooks/usePrintPreviewShortcut";

const tocItems: TocItem[] = [
  { id: "information-we-collect", title: "Information We Collect", level: 2 },
  { id: "how-we-use", title: "How We Use Your Information", level: 2 },
  { id: "legal-basis", title: "Legal Basis for Processing", level: 2 },
  { id: "data-retention", title: "Data Retention", level: 2 },
  { id: "your-rights", title: "Your Rights", level: 2 },
  { id: "data-security", title: "Data Security", level: 2 },
  { id: "cookies", title: "Cookies and Tracking", level: 2 },
  { id: "third-party", title: "Third-Party Services", level: 2 },
  { id: "contact", title: "Contact Us", level: 2 },
];

export default function PrivacyPolicy() {
  const [showPreview, setShowPreview] = useState(false);
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
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">How we collect, use, and protect your data</p>
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
        title="Privacy Policy"
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
              We respect your privacy and are committed to protecting the personal information you share with us. 
              This Privacy Policy explains what data we collect, why we collect it, how we use it, and your rights 
              regarding your information. We believe in transparency and aim to communicate our practices clearly 
              and without unnecessary complexity.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Data We Collect */}
          <section id="information-we-collect" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Information We Collect</h2>
            </div>
          
          <div className="space-y-6">
            <Card className="print:shadow-none print:border-gray-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Email Address:</strong> Collected when you sign up for early access. Used for identification, communication, and sending early access notifications.</p>
                <p><strong>First and Last Name:</strong> Optional fields collected during signup. Used to personalize email communications and identify your account.</p>
              </CardContent>
            </Card>

            <Card className="print:shadow-none print:border-gray-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Technical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>IP Address:</strong> Collected automatically for security purposes including rate limiting, bot detection, and abuse prevention. Retained for 30-90 days before automatic deletion.</p>
                <p><strong>User Agent:</strong> Browser and device information collected for bot detection and security analytics. Retained for 90 days before automatic deletion.</p>
              </CardContent>
            </Card>

            <Card className="print:shadow-none print:border-gray-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Email Engagement Data
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Email Opens and Clicks:</strong> We track when emails are opened and which links are clicked to measure campaign effectiveness and ensure email deliverability. This data is accessible only to administrators.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* How We Use Your Data */}
          <section id="how-we-use" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">How We Use Your Information</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong>Communication:</strong> To send you early access updates, product announcements, and relevant information about our service.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong>Personalization:</strong> To address you by name in our communications and tailor content to your preferences.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong>Security:</strong> To protect our service from abuse, detect and prevent fraud, and maintain the integrity of our platform.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p><strong>Analytics:</strong> To understand how our emails perform and improve our communication practices.</p>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Legal Basis */}
          <section id="legal-basis" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Legal Basis for Processing</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>We process your personal data based on the following legal grounds:</p>
            <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
              <Card className="print:shadow-none print:border-gray-300">
                <CardContent className="pt-4">
                  <h3 className="font-medium text-foreground mb-2">Consent</h3>
                  <p className="text-sm">Your email address and name are collected with your explicit consent when you sign up for early access. You can withdraw this consent at any time by unsubscribing.</p>
                </CardContent>
              </Card>
              <Card className="print:shadow-none print:border-gray-300">
                <CardContent className="pt-4">
                  <h3 className="font-medium text-foreground mb-2">Legitimate Interest</h3>
                  <p className="text-sm">Technical data like IP addresses and user agents are collected to protect our service from abuse and ensure security—a legitimate interest that does not override your privacy rights.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Data Retention */}
          <section id="data-retention" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Data Retention</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>We retain your data only as long as necessary for the purposes outlined above:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium text-foreground">Data Type</th>
                    <th className="text-left py-3 pr-4 font-medium text-foreground">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 pr-4">Email Address</td>
                    <td className="py-3 pr-4">Until you unsubscribe or request deletion</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4">First/Last Name</td>
                    <td className="py-3 pr-4">Until account deletion</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4">IP Address</td>
                    <td className="py-3 pr-4">30-90 days (automatically deleted)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4">User Agent</td>
                    <td className="py-3 pr-4">90 days (automatically deleted)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Email Engagement</td>
                    <td className="py-3 pr-4">Retained for analytics (admin access only)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              We run automated cleanup processes daily to ensure data is deleted according to these retention schedules.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Your Rights */}
          <section id="your-rights" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <UserX className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Your Rights</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>You have the following rights regarding your personal data:</p>
            <div className="grid gap-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Right to Rectification:</strong> Request correction of inaccurate personal data.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Right to Erasure:</strong> Request deletion of your personal data. You can unsubscribe from our mailing list at any time.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Right to Object:</strong> Object to processing of your personal data for certain purposes.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Right to Data Portability:</strong> Request your data in a structured, machine-readable format.</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Data Security */}
          <section id="data-security" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Data Security</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>We implement robust security measures to protect your data:</p>
            <div className="grid gap-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Encryption:</strong> All data is encrypted in transit using TLS and at rest using industry-standard encryption.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Access Controls:</strong> Row-Level Security policies restrict data access based on user roles. Sensitive data is accessible only to authorized administrators.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Monitoring:</strong> We maintain 24/7 security monitoring with automated alerts for suspicious activity.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Audit Trails:</strong> All administrative actions are logged for accountability and security review.</p>
              </div>
            </div>
            <p className="text-sm mt-4">
              For detailed information about our security practices, please see our{" "}
              <Link to="/tools/security" className="text-primary hover:underline">Security Documentation</Link>.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Cookies */}
          <section id="cookies" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Cookies and Tracking</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              We use essential cookies required for the basic functionality of our service, such as maintaining 
              your session. We do not use third-party advertising or tracking cookies. Email engagement tracking 
              (opens and clicks) uses standard email tracking pixels and link redirection.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Third-Party Services */}
          <section id="third-party" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Third-Party Services</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>We use the following third-party services to operate our platform:</p>
            <div className="grid gap-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Email Service:</strong> Resend for transactional and marketing emails.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Security:</strong> Cloudflare Turnstile for bot protection and CAPTCHA verification.</p>
              </div>
            </div>
            <p className="text-sm">
              These services have their own privacy policies and may collect data as described in their respective policies.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Contact */}
          <section id="contact" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Contact Us</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights, 
              please contact us. We aim to respond to all inquiries within 30 days.
            </p>
          </div>
        </section>

        {/* Policy Updates */}
        <section className="mb-10">
          <Card className="bg-muted/50 print:bg-gray-50 print:shadow-none print:border-gray-300">
            <CardContent className="pt-6">
              <h3 className="font-medium text-foreground mb-2">Changes to This Policy</h3>
              <p className="text-sm text-muted-foreground">
                We may update this Privacy Policy from time to time. When we make changes, we will update 
                the "Last updated" date at the top of this page. We encourage you to review this policy 
                periodically to stay informed about how we protect your information.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Footer Links */}
        <div className="flex flex-wrap gap-4 text-sm print:hidden">
          <Link to="/tools/security" className="text-primary hover:underline">
            Security Documentation
          </Link>
          <Link to="/tools/compliance-report" className="text-primary hover:underline">
            Compliance Report
          </Link>
        </div>
        </main>
      </div>

      <BackToTopButton />

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1in;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
