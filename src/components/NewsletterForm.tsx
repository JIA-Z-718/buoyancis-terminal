import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email" })
    .max(254, { message: "Email is too long" }),
});

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "early-access-signup",
        {
          body: {
            email: normalizedEmail,
            firstName: "Newsletter",
            lastName: "Subscriber",
            honeypot: "",
            turnstileToken: null, // Skip Turnstile for footer form
          },
        }
      );

      if (fnError) {
        throw fnError;
      }

      if (data?.duplicate) {
        toast({
          title: "Already subscribed",
          description: "You're already on our list!",
        });
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Newsletter signup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center gap-2 text-primary py-2">
        <div className="w-8 h-8 rounded-full bg-olive-light flex items-center justify-center">
          <Check className="w-4 h-4" />
        </div>
        <span className="text-sm text-foreground font-medium">
          You're subscribed!
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          className="h-10 rounded-full bg-background border-border focus:border-primary/50 text-sm"
          required
          maxLength={254}
          aria-label="Email address"
          aria-invalid={!!error}
        />
        <Button
          type="submit"
          variant="hero"
          size="sm"
          className="shrink-0 rounded-full px-4"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive mt-2 text-center">{error}</p>
      )}
      <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
        🔒 No spam. Only notified when your region launches.
      </p>
    </form>
  );
};

export default NewsletterForm;
