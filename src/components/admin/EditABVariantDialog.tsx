import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ABVariant {
  id: string;
  variant_name: string;
  subject: string;
  recipient_count: number;
}

interface EditABVariantDialogProps {
  variant: ABVariant | null;
  onClose: () => void;
  onSaved: () => void;
}

const EditABVariantDialog = ({ variant, onClose, onSaved }: EditABVariantDialogProps) => {
  const [variantName, setVariantName] = useState("");
  const [subject, setSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (variant) {
      setVariantName(variant.variant_name);
      setSubject(variant.subject);
    }
  }, [variant]);

  const handleSave = async () => {
    if (!variant) return;

    if (!variantName.trim()) {
      toast.error("Variant name is required");
      return;
    }

    if (!subject.trim()) {
      toast.error("Subject line is required");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("ab_test_variants")
        .update({
          variant_name: variantName.trim(),
          subject: subject.trim(),
        })
        .eq("id", variant.id);

      if (error) throw error;

      toast.success("Variant updated successfully");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Error updating variant:", error);
      toast.error(error.message || "Failed to update variant");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!variant} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit A/B Test Variant</DialogTitle>
          <DialogDescription>
            Update the variant name or subject line. Note: Recipient count cannot be changed after sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="variant-name">Variant Name</Label>
            <Input
              id="variant-name"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="e.g., A, B, Control"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Recipient Count</Label>
            <Input
              value={variant?.recipient_count || 0}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Recipient count is locked after the campaign is sent.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditABVariantDialog;
