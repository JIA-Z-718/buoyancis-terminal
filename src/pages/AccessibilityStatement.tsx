import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Accessibility, Eye, Keyboard, Monitor, MessageSquare, Clock, Download, FileSearch, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PrintPreview from "@/components/PrintPreview";
import TableOfContents, { TocItem } from "@/components/TableOfContents";
import BackToTopButton from "@/components/BackToTopButton";
import { usePrintPreviewShortcut } from "@/hooks/usePrintPreviewShortcut";

const tocItems: TocItem[] = [
  { id: "our-commitment", title: "Our Commitment", level: 2 },
  { id: "standards", title: "Standards We Follow", level: 2 },
  { id: "features", title: "Accessibility Features", level: 2 },
  { id: "keyboard-navigation", title: "Keyboard Navigation", level: 3 },
  { id: "screen-readers", title: "Screen Reader Support", level: 3 },
  { id: "visual-design", title: "Visual Design", level: 3 },
  { id: "known-limitations", title: "Known Limitations", level: 2 },
  { id: "feedback", title: "Feedback & Contact", level: 2 },
  { id: "ongoing-efforts", title: "Ongoing Efforts", level: 2 },
];

interface AccessibilityFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const keyboardFeatures: AccessibilityFeature[] = [
  {
    title: "Full Keyboard Navigation",
    description: "All interactive elements can be accessed and operated using only a keyboard.",
    icon: <Keyboard className="w-4 h-4" />,
  },
  {
    title: "Visible Focus Indicators",
    description: "Clear visual indicators show which element currently has keyboard focus.",
    icon: <Eye className="w-4 h-4" />,
  },
  {
    title: "Logical Tab Order",
    description: "Tab navigation follows a logical, predictable sequence through the page.",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    title: "Keyboard Shortcuts",
    description: "Admin dashboard includes keyboard shortcuts for common actions (press ? to view).",
    icon: <Keyboard className="w-4 h-4" />,
  },
];

const visualFeatures: AccessibilityFeature[] = [
  {
    title: "Sufficient Color Contrast",
    description: "Text and interactive elements meet WCAG AA contrast ratio requirements.",
    icon: <Eye className="w-4 h-4" />,
  },
  {
    title: "Resizable Text",
    description: "Content remains readable and functional when text is resized up to 200%.",
    icon: <Monitor className="w-4 h-4" />,
  },
  {
    title: "No Color-Only Information",
    description: "Information is not conveyed through color alone; additional cues are provided.",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    title: "Reduced Motion Support",
    description: "Animations respect the user's prefers-reduced-motion system setting.",
    icon: <Monitor className="w-4 h-4" />,
  },
];

export default function AccessibilityStatement() {
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
                <Accessibility className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Accessibility Statement</h1>
                <p className="text-muted-foreground">Our commitment to inclusive design</p>
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
              title="Accessibility Statement"
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
              Accessibility is not an afterthought—it is fundamental to how we build. We believe 
              that everyone deserves equal access to information and functionality, regardless of 
              ability or circumstance. This statement outlines our approach to accessibility and 
              the measures we take to ensure our platform is usable by all.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Our Commitment */}
          <section id="our-commitment" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Accessibility className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Our Commitment</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                We are committed to ensuring digital accessibility for people with disabilities. 
                We continually work to improve the user experience for everyone and apply relevant 
                accessibility standards throughout our development process.
              </p>
              <p>
                Accessibility is integrated into our design and development workflow from the 
                earliest stages, not added as an overlay or quick fix. We test with real assistive 
                technologies and incorporate feedback from users with diverse needs.
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Standards We Follow */}
          <section id="standards" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Standards We Follow</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground mb-6">
              <p>
                Our goal is to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 
                at Level AA. These guidelines explain how to make web content more accessible 
                to people with a wide range of disabilities.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
              <Card className="print:shadow-none print:border-gray-300">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">WCAG 2.1</Badge>
                    <Badge variant="outline">Level AA</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We target WCAG 2.1 Level AA conformance, the internationally recognized 
                    standard for web accessibility.
                  </p>
                </CardContent>
              </Card>
              <Card className="print:shadow-none print:border-gray-300">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">WAI-ARIA</Badge>
                    <Badge variant="outline">1.2</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We use WAI-ARIA landmarks and attributes to enhance the experience 
                    for screen reader users.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Accessibility Features */}
          <section id="features" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Accessibility Features</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground mb-6">
              <p>
                We have implemented numerous accessibility features throughout our platform. 
                Below are some of the key features organized by category.
              </p>
            </div>

            {/* Keyboard Navigation */}
            <div id="keyboard-navigation" className="mb-8 scroll-mt-24">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-primary" />
                Keyboard Navigation
              </h3>
              
              <div className="grid gap-3">
                {keyboardFeatures.map((feature) => (
                  <Card key={feature.title} className="print:shadow-none print:border-gray-300">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted text-primary flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Screen Reader Support */}
            <div id="screen-readers" className="mb-8 scroll-mt-24">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Screen Reader Support
              </h3>
              
              <div className="space-y-3">
                <Card className="print:shadow-none print:border-gray-300">
                  <CardContent className="pt-4">
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>Semantic HTML structure with proper heading hierarchy</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>ARIA landmarks to identify page regions (navigation, main, footer)</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>Descriptive labels for all form inputs and interactive elements</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>ARIA live regions for dynamic content updates and notifications</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>Alternative text for images and meaningful graphics</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Visual Design */}
            <div id="visual-design" className="scroll-mt-24">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Visual Design
              </h3>
              
              <div className="grid gap-3">
                {visualFeatures.map((feature) => (
                  <Card key={feature.title} className="print:shadow-none print:border-gray-300">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted text-primary flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Known Limitations */}
          <section id="known-limitations" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Known Limitations</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                While we strive for full accessibility, we acknowledge that some areas may 
                still need improvement. We are actively working to address these limitations:
              </p>
              <Card className="bg-muted/50 print:shadow-none print:border-gray-300">
                <CardContent className="pt-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Some complex data visualizations may have limited screen reader descriptions</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>PDF exports may not be fully accessible; we recommend using the web version</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Third-party embedded content may not meet our accessibility standards</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <p className="text-sm">
                We are committed to addressing these issues and welcome feedback on how we 
                can improve.
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Feedback & Contact */}
          <section id="feedback" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Feedback & Contact</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                We welcome your feedback on the accessibility of our platform. If you encounter 
                any barriers or have suggestions for improvement, please let us know. Your input 
                helps us create a better experience for everyone.
              </p>
              <Card className="print:shadow-none print:border-gray-300">
                <CardContent className="pt-4">
                  <h3 className="font-medium text-foreground mb-2">When contacting us, please include:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>A description of the accessibility issue you encountered</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>The page URL where the issue occurred</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>The assistive technology you were using (if applicable)</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Your browser and operating system</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <p className="text-sm">
                We aim to respond to accessibility feedback within 5 business days.
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Ongoing Efforts */}
          <section id="ongoing-efforts" className="mb-10 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Accessibility className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Ongoing Efforts</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                Accessibility is an ongoing commitment, not a one-time effort. We continuously 
                work to improve our platform through:
              </p>
              <div className="grid gap-3">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Regular accessibility audits using automated tools and manual testing</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Testing with various assistive technologies including screen readers</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Training our team on accessibility best practices</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Incorporating user feedback into our development roadmap</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Staying current with evolving accessibility standards and guidelines</p>
                </div>
              </div>
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
                  <Link to="/legal/cookies">Cookie Policy</Link>
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
