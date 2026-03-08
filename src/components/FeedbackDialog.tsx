import { useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type TurnstileInstance } from "@marsidev/react-turnstile";
import TurnstileWrapper from "@/components/TurnstileWrapper";

// Cloudflare Turnstile site key (public)
const TURNSTILE_SITE_KEY = "0x4AAAAAABfBz0T_eE_wLYvn";

const FeedbackDialog = () => {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const { toast } = useToast();

  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback.",
        variant: "destructive",
      });
      return;
    }

    if (!turnstileToken) {
      toast({
        title: "Verification required",
        description: "Please complete the security check before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("submit-feedback", {
        body: {
          feedbackType,
          message: message.trim(),
          email: email.trim() || undefined,
          turnstileToken,
          source: "feedback_dialog",
        },
      });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted.",
      });

      setMessage("");
      setEmail("");
      setFeedbackType("general");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setTurnstileError(false);
      setOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });

      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="calm" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Share feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Share your thoughts</DialogTitle>
          <DialogDescription>
            Help us improve Buoyancis. Your feedback shapes what we build next.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>What kind of feedback?</Label>
            <RadioGroup
              value={feedbackType}
              onValueChange={setFeedbackType}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="general" id="general" />
                <Label htmlFor="general" className="font-normal cursor-pointer">
                  General
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feature" id="feature" />
                <Label htmlFor="feature" className="font-normal cursor-pointer">
                  Feature request
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="issue" id="issue" />
                <Label htmlFor="issue" className="font-normal cursor-pointer">
                  Issue
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Your feedback</Label>
            <Textarea
              id="message"
              placeholder="What's on your mind?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If you'd like us to follow up with you
            </p>
          </div>

          {/* Cloudflare Turnstile CAPTCHA */}
          <div className="flex justify-center">
            <TurnstileWrapper
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setTurnstileError(false);
              }}
              onError={() => {
                setTurnstileError(true);
                setTurnstileToken(null);
              }}
              onExpire={() => {
                setTurnstileToken(null);
              }}
              options={{ theme: "auto" }}
            />
          </div>
          {turnstileError && (
            <p className="text-xs text-destructive text-center">
              Security check failed. Please refresh and try again.
            </p>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !turnstileToken}
          >
            {isSubmitting ? "Submitting..." : "Submit feedback"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
