import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { PasswordStrengthIndicator, validatePasswordStrength } from "@/components/PasswordStrengthIndicator";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let hasResolved = false;

    // Set up the auth state change listener FIRST (before checking session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        hasResolved = true;
        setIsValidSession(true);
        if (timeoutId) clearTimeout(timeoutId);
      } else if (event === "SIGNED_IN" && session) {
        // User might already be signed in from the recovery flow
        hasResolved = true;
        setIsValidSession(true);
        if (timeoutId) clearTimeout(timeoutId);
      }
    });

    // Then check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && !hasResolved) {
        // We have a session, user can update password
        hasResolved = true;
        setIsValidSession(true);
      } else if (!hasResolved) {
        // Wait for auth state change or timeout
        timeoutId = setTimeout(() => {
          if (!hasResolved) {
            setIsValidSession(false);
          }
        }, 3000);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <main id="main-content" className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying reset link...</p>
        </div>
      </main>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <main id="main-content" className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-serif text-foreground mb-2">Invalid or expired link</h1>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth/forgot-password">Request new link</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <main id="main-content" className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-serif text-foreground mb-2">Password updated!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully reset. Redirecting you to login...
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/login">Go to login</Link>
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
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-serif text-foreground mb-2">Set new password</h1>
          <p className="text-muted-foreground mb-6">
            Enter your new password below. Make sure it's at least 8 characters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <PasswordStrengthIndicator password={password} className="mt-3" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
