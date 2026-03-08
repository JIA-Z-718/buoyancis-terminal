import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Users, AlertTriangle, Scale, Ban, RefreshCw, Mail, Download, FileSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PrintPreview from "@/components/PrintPreview";
import TableOfContents, { TocItem } from "@/components/TableOfContents";
import BackToTopButton from "@/components/BackToTopButton";
import { usePrintPreviewShortcut } from "@/hooks/usePrintPreviewShortcut";

const tocItems: TocItem[] = [
  { id: "acceptance", title: "Acceptance of Terms", level: 2 },
  { id: "description", title: "Description of Service", level: 2 },
  { id: "responsibilities", title: "User Responsibilities", level: 2 },
  { id: "prohibited", title: "Prohibited Activities", level: 2 },
  { id: "intellectual-property", title: "Intellectual Property", level: 2 },
  { id: "disclaimer", title: "Disclaimer of Warranties", level: 2 },
  { id: "liability", title: "Limitation of Liability", level: 2 },
  { id: "termination", title: "Termination", level: 2 },
  { id: "changes", title: "Changes to These Terms", level: 2 },
  { id: "governing-law", title: "Governing Law", level: 2 },
  { id: "contact", title: "Contact Us", level: 2 },
];

export default function TermsOfService() {
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
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Terms of Service</h1>
                <p className="text-muted-foreground">The agreement between you and Buoyancis</p>
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
        title="Terms of Service"
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
              Welcome to Buoyancis. These Terms of Service ("Terms") govern your access to and use of our 
              services. By accessing or using Buoyancis, you agree to be bound by these Terms. Please read 
              them carefully. If you do not agree to these Terms, you may not use our services.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Acceptance of Terms */}
          <section id="acceptance" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              By signing up for early access, creating an account, or otherwise using our services, you 
              acknowledge that you have read, understood, and agree to be bound by these Terms. You also 
              agree to comply with all applicable laws and regulations.
            </p>
            <p>
              If you are using our services on behalf of an organization, you represent and warrant that 
              you have the authority to bind that organization to these Terms.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Description of Service */}
          <section id="description" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Description of Service</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              Buoyancis provides a platform designed to help users navigate information with clarity and 
              trust. Our services may include, but are not limited to:
            </p>
            <div className="grid gap-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Early access registration and notification services</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Email communications regarding product updates and announcements</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Access to platform features as they become available</p>
              </div>
            </div>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of our services at any 
              time without prior notice.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* User Responsibilities */}
          <section id="responsibilities" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">User Responsibilities</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>When using our services, you agree to:</p>
            <div className="grid gap-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Provide accurate information:</strong> You must provide truthful and accurate information when signing up or communicating with us.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Maintain account security:</strong> You are responsible for maintaining the confidentiality of any account credentials.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Use services lawfully:</strong> You may not use our services for any illegal or unauthorized purpose.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p><strong>Respect others:</strong> You may not harass, abuse, or harm other users or our staff.</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Prohibited Activities */}
          <section id="prohibited" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Prohibited Activities</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <div className="grid gap-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Attempting to gain unauthorized access to our systems or other users' accounts</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Using automated systems (bots, scrapers) to access our services without permission</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Transmitting malware, viruses, or other malicious code</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Interfering with or disrupting the integrity or performance of our services</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Impersonating another person or entity</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Intellectual Property */}
          <section id="intellectual-property" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Intellectual Property</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              All content, features, and functionality of our services—including but not limited to text, 
              graphics, logos, icons, and software—are owned by Buoyancis or our licensors and are protected 
              by intellectual property laws.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or lease any part of our services without our 
              prior written consent.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Disclaimer of Warranties */}
          <section id="disclaimer" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Disclaimer of Warranties</h2>
            </div>
          
          <Card className="bg-muted/50 print:bg-gray-50 print:shadow-none print:border-gray-300">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, 
                ERROR-FREE, OR COMPLETELY SECURE. YOUR USE OF OUR SERVICES IS AT YOUR OWN RISK.
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Limitation of Liability */}
          <section id="liability" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Limitation of Liability</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              To the maximum extent permitted by law, Buoyancis shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other 
              intangible losses resulting from:
            </p>
            <div className="grid gap-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Your access to or use of (or inability to access or use) our services</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Any conduct or content of any third party on our services</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>Unauthorized access, use, or alteration of your transmissions or content</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Termination */}
          <section id="termination" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Termination</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              We may terminate or suspend your access to our services immediately, without prior notice or 
              liability, for any reason, including if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use our services will immediately cease. All provisions of 
              these Terms that by their nature should survive termination shall survive, including ownership 
              provisions, warranty disclaimers, and limitations of liability.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Changes to Terms */}
          <section id="changes" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Changes to These Terms</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              We reserve the right to modify these Terms at any time. When we make changes, we will update 
              the "Last updated" date at the top of this page. Your continued use of our services after any 
              changes constitutes acceptance of the new Terms.
            </p>
            <p>
              We encourage you to review these Terms periodically to stay informed of any updates.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Governing Law */}
          <section id="governing-law" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Governing Law</h2>
            </div>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without 
              regard to conflict of law principles. Any disputes arising from these Terms shall be resolved 
              through good-faith negotiation or, if necessary, through binding arbitration.
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
              If you have any questions about these Terms of Service, please contact us. We are committed 
              to addressing your concerns promptly and fairly.
            </p>
          </div>
        </section>

        {/* Footer Links */}
        <div className="flex flex-wrap gap-4 text-sm print:hidden">
          <Link to="/legal/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
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
