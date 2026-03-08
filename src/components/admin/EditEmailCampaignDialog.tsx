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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Code, Eye } from "lucide-react";
import EmailPreview from "./email-campaign/EmailPreview";
import TestEmailSection from "./email-campaign/TestEmailSection";
import CampaignMetadata from "./email-campaign/CampaignMetadata";

interface Campaign {
  id: string;
  subject: string;
  body: string;
  recipient_count: number;
  sent_at: string;
}

interface EditEmailCampaignDialogProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSaved: () => void;
}

const EditEmailCampaignDialog = ({ campaign, onClose, onSaved }: EditEmailCampaignDialogProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [previewViewport, setPreviewViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    if (campaign) {
      setSubject(campaign.subject);
      setBody(campaign.body);
      setActiveTab("edit");
    }
  }, [campaign]);

  const handleSave = async () => {
    if (!campaign) return;

    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!body.trim()) {
      toast.error("Email body is required");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("email_campaigns")
        .update({
          subject: subject.trim(),
          body: body.trim(),
        })
        .eq("id", campaign.id);

      if (error) throw error;

      toast.success("Campaign updated successfully");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Error updating campaign:", error);
      toast.error(error.message || "Failed to update campaign");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!campaign} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Email Campaign</DialogTitle>
          <DialogDescription>
            Update the campaign subject or body. Note: This won't affect already-sent emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="campaign-subject">Subject Line</Label>
            <Input
              id="campaign-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
            />
          </div>

          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <Label>Email Body</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-fit">
                <TabsTrigger value="edit" className="flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5" />
                  Edit HTML
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="flex-1 overflow-hidden mt-2">
                <Textarea
                  id="campaign-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email body content (HTML)..."
                  className="h-full min-h-[250px] font-mono text-sm resize-none"
                />
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-hidden mt-2">
                <EmailPreview
                  body={body}
                  viewport={previewViewport}
                  onViewportChange={setPreviewViewport}
                />
              </TabsContent>
            </Tabs>
          </div>

          <CampaignMetadata
            recipientCount={campaign?.recipient_count || 0}
            sentAt={campaign?.sent_at || null}
          />

          <TestEmailSection subject={subject} body={body} />

          <p className="text-xs text-muted-foreground">
            Editing this campaign record is for documentation purposes only. The emails have already been sent to recipients.
          </p>
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

export default EditEmailCampaignDialog;
