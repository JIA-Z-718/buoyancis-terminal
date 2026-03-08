import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, ZoomIn, ZoomOut, List, Stamp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DOMPurify from "dompurify";

type WatermarkOption = "none" | "confidential" | "draft" | "internal" | "sample";

// Escape HTML entities for safe text embedding in HTML templates
const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

interface TocEntry {
  id: string;
  text: string;
  level: number;
}
interface PrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  contentSelector?: string;
}

export default function PrintPreview({ 
  isOpen, 
  onClose, 
  title,
  contentSelector = "main" 
}: PrintPreviewProps) {
  const [scale, setScale] = useState(0.6);
  const [content, setContent] = useState<string>("");
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [showToc, setShowToc] = useState(true);
  const [watermark, setWatermark] = useState<WatermarkOption>("none");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const watermarkLabels: Record<WatermarkOption, string> = {
    none: "No Watermark",
    confidential: "CONFIDENTIAL",
    draft: "DRAFT",
    internal: "INTERNAL USE ONLY",
    sample: "SAMPLE"
  };
  useEffect(() => {
    if (isOpen) {
      // Capture the main content for preview
      const mainContent = document.querySelector(contentSelector);
      if (mainContent) {
        // Clone and clean up the content
        const clone = mainContent.cloneNode(true) as HTMLElement;
        
        // Remove interactive elements and print:hidden elements
        clone.querySelectorAll("button, .print\\:hidden, [class*='print:hidden']").forEach(el => el.remove());
        
        // Extract headings for table of contents
        // Use textContent to strip any HTML and prevent XSS
        const headings = clone.querySelectorAll("h1, h2, h3");
        const entries: TocEntry[] = [];
        
        headings.forEach((heading, index) => {
          const id = `toc-heading-${index}`;
          heading.setAttribute("id", id);
          
          // Use textContent to extract plain text, stripping any embedded HTML
          const text = heading.textContent?.trim() || "";
          if (text) {
            entries.push({
              id,
              text,
              level: parseInt(heading.tagName.charAt(1), 10)
            });
          }
        });
        
        setTocEntries(entries);
        // Sanitize the HTML content to prevent XSS attacks
        const sanitizedContent = DOMPurify.sanitize(clone.innerHTML, {
          ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'a', 'ul', 'ol', 'li', 
                         'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'b', 'i', 'br', 
                         'hr', 'img', 'blockquote', 'pre', 'code', 'section', 'article', 'nav', 'aside',
                         'header', 'footer', 'figure', 'figcaption', 'time', 'mark', 'small', 'sub', 'sup'],
          ALLOWED_ATTR: ['id', 'class', 'href', 'src', 'alt', 'title', 'data-orientation', 'role', 'aria-label'],
          FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
          FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur']
        });
        setContent(sanitizedContent);
      }
    }
  }, [isOpen, contentSelector]);

  const handlePrint = () => {
    onClose();
    setTimeout(() => window.print(), 100);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Inline styles that simulate print CSS with headers/footers
  const previewStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500&display=swap');
      
      @page {
        size: A4;
        margin: 20mm 15mm 25mm 15mm;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      html {
        counter-reset: page-counter;
      }
      
      body {
        font-family: 'Inter', system-ui, sans-serif;
        background: white;
        color: #1a1a1a;
        padding: 0;
        font-size: 11pt;
        line-height: 1.6;
      }
      
      /* Document header */
      .print-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        padding: 8px 0;
        border-bottom: 1px solid #e5e5e5;
        background: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9pt;
        color: #666;
      }
      
      .print-header .doc-title {
        font-weight: 500;
        color: #1a1a1a;
      }
      
      .print-header .doc-date {
        color: #888;
      }
      
      /* Document footer with page numbers */
      .print-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30px;
        padding: 8px 0;
        border-top: 1px solid #e5e5e5;
        background: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9pt;
        color: #888;
      }
      
      .print-footer .company-name {
        font-weight: 500;
        color: #4a6741;
      }
      
      .print-footer .page-number {
        font-weight: 500;
      }
      
      /* Main content area with padding for header/footer */
      .print-content {
        padding: 50px 0 40px 0;
      }
      
      h1, h2, h3 {
        font-family: 'Playfair Display', Georgia, serif;
        color: #1a1a1a;
      }
      
      h1 { font-size: 24pt; margin-bottom: 16px; }
      h2 { font-size: 16pt; margin-bottom: 12px; margin-top: 24px; page-break-after: avoid; }
      h3 { font-size: 13pt; margin-bottom: 8px; page-break-after: avoid; }
      
      p { margin-bottom: 8px; color: #4a4a4a; }
      
      a { color: #4a6741; text-decoration: none; }
      
      /* Card styling */
      [class*="rounded"] {
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        background: #fafafa;
        page-break-inside: avoid;
      }
      
      /* Table styling */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 10pt;
        page-break-inside: avoid;
      }
      
      th, td {
        border: 1px solid #e5e5e5;
        padding: 8px 12px;
        text-align: left;
      }
      
      th {
        background: #f5f5f5;
        font-weight: 600;
      }
      
      /* Separator */
      [data-orientation="horizontal"] {
        height: 1px;
        background: #e5e5e5;
        margin: 24px 0;
      }
      
      /* Badge */
      [class*="badge"] {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 9pt;
        background: #f0f0f0;
        color: #4a4a4a;
      }
      
      /* Icons - hide SVG icons */
      svg {
        display: none;
      }
      
      /* List bullet points */
      .flex.gap-3 > div:first-child {
        width: 6px;
        height: 6px;
        background: #4a6741;
        border-radius: 50%;
        margin-top: 6px;
        flex-shrink: 0;
      }
      
      /* Grid layouts */
      .grid {
        display: block;
      }
      
      .grid > * {
        margin-bottom: 12px;
      }

      /* Section headers with icons */
      .flex.items-center.gap-2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      /* Page break utilities */
      .page-break-before {
        page-break-before: always;
      }
      
      .page-break-after {
        page-break-after: always;
      }
      
      .avoid-break {
        page-break-inside: avoid;
      }
      
      /* Table of Contents Styles */
      .print-toc {
        margin-bottom: 32px;
        padding: 20px 24px;
        background: #f8f9fa;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        page-break-after: always;
      }
      
      .print-toc h2 {
        font-size: 16pt;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #4a6741;
        color: #1a1a1a;
      }
      
      .toc-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .toc-item {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px dotted #ddd;
      }
      
      .toc-item:last-child {
        border-bottom: none;
      }
      
      .toc-item.level-1 {
        font-weight: 600;
        font-size: 11pt;
      }
      
      .toc-item.level-2 {
        padding-left: 16px;
        font-size: 10pt;
      }
      
      .toc-item.level-3 {
        padding-left: 32px;
        font-size: 9pt;
        color: #666;
      }
      
      .toc-text {
        flex: 1;
      }
      
      .toc-dots {
        flex: 1;
        border-bottom: 1px dotted #ccc;
        min-width: 40px;
      }
      
      .toc-page {
        color: #4a6741;
        font-weight: 500;
        min-width: 20px;
        text-align: right;
      }
      
      /* Watermark Styles */
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72pt;
        font-weight: 700;
        color: rgba(200, 200, 200, 0.25);
        text-transform: uppercase;
        letter-spacing: 8px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000;
        user-select: none;
      }
      
      @media print {
        .watermark {
          color: rgba(200, 200, 200, 0.2);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  `;

  // Generate table of contents HTML with sanitized content
  const generateTocHtml = () => {
    if (!showToc || tocEntries.length === 0) return "";
    
    // Escape HTML entities in TOC entries to prevent XSS
    const tocItems = tocEntries.map((entry, index) => `
      <li class="toc-item level-${entry.level}">
        <span class="toc-text">${escapeHtml(entry.text)}</span>
        <span class="toc-dots"></span>
        <span class="toc-page">${index + 1}</span>
      </li>
    `).join("");
    
    return `
      <div class="print-toc">
        <h2>Table of Contents</h2>
        <ol class="toc-list">
          ${tocItems}
        </ol>
      </div>
    `;
  };

  // Generate watermark HTML
  const generateWatermarkHtml = () => {
    if (watermark === "none") return "";
    return `<div class="watermark">${watermarkLabels[watermark]}</div>`;
  };

  // Generate the full HTML with header, footer, TOC, watermark, and content
  // Title and date are escaped to prevent XSS attacks
  const generateFullHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'unsafe-inline';">
        ${previewStyles}
      </head>
      <body>
        ${generateWatermarkHtml()}
        
        <div class="print-header">
          <span class="doc-title">${escapeHtml(title)}</span>
          <span class="doc-date">Generated: ${escapeHtml(currentDate)}</span>
        </div>
        
        <div class="print-footer">
          <span class="company-name">Buoyancis</span>
          <span class="page-number">Page <span class="current-page"></span></span>
        </div>
        
        <div class="print-content">
          ${generateTocHtml()}
          ${content}
        </div>
        
        <script>
          // Simple page number simulation for preview
          document.querySelector('.current-page').textContent = '1';
        </script>
      </body>
    </html>
  `;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Print Preview: {title}</DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-4 pr-4 border-r">
                <Stamp className="w-4 h-4 text-muted-foreground" />
                <Select value={watermark} onValueChange={(v) => setWatermark(v as WatermarkOption)}>
                  <SelectTrigger className="w-[150px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Watermark</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="internal">Internal Use</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tocEntries.length > 0 && (
                <div className="flex items-center gap-2 mr-4 pr-4 border-r">
                  <Switch
                    id="show-toc"
                    checked={showToc}
                    onCheckedChange={setShowToc}
                  />
                  <Label htmlFor="show-toc" className="text-sm flex items-center gap-1.5 cursor-pointer">
                    <List className="w-4 h-4" />
                    TOC
                  </Label>
                </div>
              )}
              <div className="flex items-center gap-1 mr-4">
                <Button variant="ghost" size="icon" onClick={zoomOut} className="h-8 w-8">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button variant="ghost" size="icon" onClick={zoomIn} className="h-8 w-8">
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handlePrint} size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/50 p-8">
          <div 
            className="mx-auto bg-white shadow-lg transition-transform duration-200 origin-top"
            style={{ 
              width: '210mm', 
              minHeight: '297mm',
              transform: `scale(${scale})`,
              transformOrigin: 'top center'
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={generateFullHtml()}
              className="w-full border-0"
              style={{ minHeight: '297mm' }}
              title="Print Preview"
            />
          </div>
        </div>
        
        <div className="px-6 py-3 border-t bg-card flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            This preview simulates how your document will appear when printed. Headers, footers, and page numbers will appear on each printed page.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
