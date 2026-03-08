import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One special character (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const results = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      met: req.test(password),
    }));
  }, [password]);

  const strength = useMemo(() => {
    const metCount = results.filter((r) => r.met).length;
    if (metCount === 0) return { label: "", color: "bg-muted", width: "0%" };
    if (metCount <= 2) return { label: "Weak", color: "bg-destructive", width: "33%" };
    if (metCount <= 4) return { label: "Medium", color: "bg-amber-500", width: "66%" };
    return { label: "Strong", color: "bg-primary", width: "100%" };
  }, [results]);

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              "font-medium",
              strength.label === "Weak" && "text-destructive",
              strength.label === "Medium" && "text-amber-500",
              strength.label === "Strong" && "text-primary"
            )}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
            style={{ width: strength.width }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <ul className="space-y-1.5">
        {results.map((req) => (
          <li
            key={req.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              req.met ? "text-primary" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
  const unmetRequirements = requirements.filter((req) => !req.test(password));
  
  if (unmetRequirements.length === 0) {
    return { valid: true, message: "" };
  }
  
  return {
    valid: false,
    message: `Password must have: ${unmetRequirements.map((r) => r.label.toLowerCase()).join(", ")}`,
  };
};

export default PasswordStrengthIndicator;
