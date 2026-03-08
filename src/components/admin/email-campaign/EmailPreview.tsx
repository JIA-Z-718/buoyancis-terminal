import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Smartphone, Tablet, Monitor } from "lucide-react";

type ViewportType = "mobile" | "tablet" | "desktop";

interface EmailPreviewProps {
  body: string;
  viewport: ViewportType;
  onViewportChange: (viewport: ViewportType) => void;
}

const EmailPreview = ({ body, viewport, onViewportChange }: EmailPreviewProps) => {
  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-2">
      <div className="flex justify-end">
        <ToggleGroup
          type="single"
          value={viewport}
          onValueChange={(value) => value && onViewportChange(value as ViewportType)}
          className="border rounded-md p-0.5 bg-muted/50"
        >
          <ToggleGroupItem value="mobile" aria-label="Mobile view" className="h-7 px-2.5 data-[state=on]:bg-background">
            <Smartphone className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Mobile</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="tablet" aria-label="Tablet view" className="h-7 px-2.5 data-[state=on]:bg-background">
            <Tablet className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Tablet</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="desktop" aria-label="Desktop view" className="h-7 px-2.5 data-[state=on]:bg-background">
            <Monitor className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Desktop</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex-1 min-h-[250px] border rounded-md bg-muted/30 overflow-auto flex justify-center p-4">
        <div 
          className={`bg-white border rounded-md shadow-sm transition-all duration-200 ${
            viewport === "mobile" ? "w-[375px]" : viewport === "tablet" ? "w-[768px]" : "w-full max-w-[600px]"
          }`}
          style={{ height: "fit-content", minHeight: "200px" }}
        >
          {body.trim() ? (
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                      body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.5;
                        color: #333;
                        padding: 16px;
                        margin: 0;
                      }
                      img { max-width: 100%; height: auto; }
                      a { color: #5a6f3c; }
                    </style>
                  </head>
                  <body>${body}</body>
                </html>
              `}
              className="w-full min-h-[200px] border-0"
              style={{ height: "250px" }}
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              <p>Enter HTML content to see preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
