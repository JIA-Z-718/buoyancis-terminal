import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import EmailAutocompleteInput from "@/components/ui/email-autocomplete-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface TestEmailSectionProps {
  subject: string;
  body: string;
}

const TestEmailSection = ({ subject, body }: TestEmailSectionProps) => {
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required to send a test email");
      return;
    }

    setIsSendingTest(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to send test emails");
        return;
      }

      const response = await supabase.functions.invoke("send-test-campaign-email", {
        body: {
          email: testEmail.trim(),
          subject: subject.trim(),
          body: body.trim(),
        },
      });

      if (response.error) throw response.error;

      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail("");
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="border rounded-md p-3 bg-muted/30 space-y-2">
      <Label htmlFor="test-email" className="text-sm font-medium">Send Test Email</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <EmailAutocompleteInput
            id="test-email"
            value={testEmail}
            onValueChange={setTestEmail}
            placeholder="Enter email address..."
            isSubmitting={isSendingTest}
            showSendToMyself
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleSendTest}
          disabled={isSendingTest || !subject.trim() || !body.trim()}
        >
          {isSendingTest ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="ml-1.5">Send Test</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Preview this email in an actual inbox before sending to recipients.
      </p>
    </div>
  );
};

export default TestEmailSection;
