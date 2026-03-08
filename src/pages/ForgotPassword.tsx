import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the edge function to send the password reset email
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: email.trim() },
      });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Something went wrong",
        description: "Unable to send reset email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <main id="main-content" className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-serif text-foreground mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-6">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
              className="w-full"
            >
              Try a different email
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
            to="/auth/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="glass-card p-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-serif text-foreground mb-2">Forgot password?</h1>
          <p className="text-muted-foreground mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
