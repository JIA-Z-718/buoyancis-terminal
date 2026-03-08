import { useEffect, useRef, useState } from "react";
import { useParallax } from "@/hooks/useParallax";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type TurnstileInstance } from "@marsidev/react-turnstile";
import TurnstileWrapper from "@/components/TurnstileWrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contactSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .optional()
    .or(z.literal("")),
  feedback_type: z.string().min(1, { message: "Please select a topic" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(1000, { message: "Message must be less than 1000 characters" }),
});

type ContactFormData = z.infer<typeof contactSchema>;

const feedbackTypes = [
  { value: "question", label: "General question" },
  { value: "feedback", label: "Feedback" },
  { value: "bug", label: "Report an issue" },
  { value: "partnership", label: "Partnership inquiry" },
  { value: "other", label: "Other" },
];

// Cloudflare Turnstile site key (public)
const TURNSTILE_SITE_KEY = "0x4AAAAAABfBz0T_eE_wLYvn";

const ContactForm = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const parallaxOffset = useParallax(0.01);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      feedback_type: "",
      message: "",
    },
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const onSubmit = async (data: ContactFormData) => {
    if (!turnstileToken) {
      toast.error("Verification required. Please complete the security check.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-feedback", {
        body: {
          email: data.email || undefined,
          feedbackType: data.feedback_type,
          message: data.message.trim(),
          turnstileToken,
          source: "contact_form",
        },
      });

      if (error) throw error;

      // Send confirmation email if email was provided
      if (data.email) {
        try {
          await supabase.functions.invoke("send-contact-confirmation", {
            body: {
              email: data.email,
              feedbackType: data.feedback_type,
              message: data.message.trim(),
            },
          });
        } catch (emailError) {
          // Log but don't fail the submission if email fails
          console.error("Failed to send confirmation email:", emailError);
        }
      }

      toast.success("Message sent! We'll get back to you soon.");
      form.reset();

      // Reset Turnstile after a successful submission
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setTurnstileError(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to send message. Please try again.");

      // Reset Turnstile on error so user can try again
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="section-padding bg-background relative overflow-hidden scroll-mt-20"
    >
      {/* Parallax background layer */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-cream/20 via-transparent to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />

      <div className="container-narrow relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2
            className={`text-3xl md:text-4xl font-serif text-foreground mb-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Get in touch
          </h2>
          <p
            className={`text-muted-foreground max-w-lg mx-auto transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Have a question or want to share your thoughts? We'd love to hear from you.
          </p>
        </div>

        {/* Form */}
        <div
          className={`max-w-md mx-auto transition-all duration-700 ease-out delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Email <span className="text-muted-foreground text-xs">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="bg-card border-border/60 focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedback_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Topic</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card border-border/60 focus:border-primary">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {feedbackTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your message..."
                        className="bg-card border-border/60 focus:border-primary min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                <p className="text-sm text-destructive text-center">
                  Security check failed. Please refresh and try again.
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !turnstileToken}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send message
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
