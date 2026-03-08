import { useState, useEffect } from "react";
import { Code2, Copy, Check, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

interface SchemaViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SchemaViewerModal({ open, onOpenChange }: SchemaViewerModalProps) {
  const [schema, setSchema] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && !schema) {
      setIsLoading(true);
      fetch("/schemas/compliance-report.schema.json")
        .then((res) => res.json())
        .then((data) => {
          setSchema(JSON.stringify(data, null, 2));
        })
        .catch((err) => {
          console.error("Failed to load schema:", err);
          toast({
            title: "Error",
            description: "Failed to load schema file",
            variant: "destructive",
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, schema]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(schema);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Schema copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleOpenRaw = () => {
    window.open("/schemas/compliance-report.schema.json", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            Compliance Report JSON Schema
          </DialogTitle>
          <DialogDescription>
            JSON Schema (Draft 2020-12) defining the structure for exported compliance reports.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy Schema"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenRaw}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Raw
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0 border rounded-lg bg-muted/30">
          {isLoading ? (
            <div className="p-4 text-muted-foreground">Loading schema...</div>
          ) : (
            <pre className="p-4 text-sm font-mono text-foreground whitespace-pre overflow-x-auto">
              {schema}
            </pre>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
