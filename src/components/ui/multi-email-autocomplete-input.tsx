import { forwardRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useEmailAutocomplete, type UseEmailAutocompleteOptions } from "@/hooks/useEmailAutocomplete";
import { cn } from "@/lib/utils";
import EmailInputBase from "./email-input-base";

interface EmailValidation {
  email: string;
  isValid: boolean;
}

export interface MultiEmailAutocompleteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  /** Current comma-separated email value (controlled) */
  value: string;
  /** Callback when email value changes */
  onValueChange: (value: string) => void;
  /** Whether the input is in a loading/disabled state */
  isSubmitting?: boolean;
  /** Options passed to the useEmailAutocomplete hook */
  autocompleteOptions?: UseEmailAutocompleteOptions;
  /** Custom class for the container */
  containerClassName?: string;
  /** Show validation badges below input */
  showValidationBadges?: boolean;
  /** Custom validation function */
  emailValidator?: (email: string) => boolean;
  /** Called when emails are saved (for localStorage sync) */
  onSave?: (emails: string[]) => void;
}

const defaultEmailValidator = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const MultiEmailAutocompleteInput = forwardRef<HTMLInputElement, MultiEmailAutocompleteInputProps>(
  (
    {
      value,
      onValueChange,
      isSubmitting = false,
      autocompleteOptions,
      containerClassName,
      showValidationBadges = true,
      emailValidator = defaultEmailValidator,
      onSave,
      className,
      disabled,
      ...inputProps
    },
    ref
  ) => {
    const {
      recentEmails,
      isLoading: isLoadingEmails,
      showSuggestions,
      setShowSuggestions,
      highlightedIndex,
      setHighlightedIndex,
      saveToLocalStorage,
    } = useEmailAutocomplete(autocompleteOptions);

    // Parse and validate emails
    const emailValidations = useMemo((): EmailValidation[] => {
      if (!value.trim()) return [];
      return value
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
        .map((email) => ({
          email,
          isValid: emailValidator(email),
        }));
    }, [value, emailValidator]);

    const hasInvalidEmails = emailValidations.some((v) => !v.isValid);
    const hasValidEmails = emailValidations.some((v) => v.isValid);

    // Get filtered suggestions for multi-email input
    const filteredSuggestions = useMemo(() => {
      const parts = value.split(",");
      const currentPart = parts[parts.length - 1].trim().toLowerCase();
      const existingEmails = emailValidations.map((v) => v.email.toLowerCase());

      return recentEmails
        .filter(
          (email) =>
            email.toLowerCase().includes(currentPart) &&
            !existingEmails.includes(email.toLowerCase())
        )
        .slice(0, 5);
    }, [value, emailValidations, recentEmails]);

    // Map to suggestion items
    const suggestions = useMemo(
      () =>
        filteredSuggestions.map((email, index) => ({
          email,
          isHighlighted: index === highlightedIndex,
        })),
      [filteredSuggestions, highlightedIndex]
    );

    const handleSelectSuggestion = (email: string) => {
      const parts = value.split(",");
      parts[parts.length - 1] = " " + email;
      const newValue = parts.join(",").replace(/^,\s*/, "").trim() + ", ";
      onValueChange(newValue);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    };

    const handleRemoveEmail = (index: number) => {
      const emails = value
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
        .filter((_, i) => i !== index);
      onValueChange(emails.join(", "));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showSuggestions && filteredSuggestions.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setHighlightedIndex(
              highlightedIndex < filteredSuggestions.length - 1 ? highlightedIndex + 1 : 0
            );
            return;
          case "ArrowUp":
            e.preventDefault();
            setHighlightedIndex(
              highlightedIndex > 0 ? highlightedIndex - 1 : filteredSuggestions.length - 1
            );
            return;
          case "Enter":
            if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
              e.preventDefault();
              handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
              return;
            }
            break;
          case "Escape":
            setShowSuggestions(false);
            setHighlightedIndex(-1);
            return;
        }
      }

      // Add comma/enter to finalize email entry
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const trimmedValue = value.trim();
        if (trimmedValue && !trimmedValue.endsWith(",")) {
          onValueChange(trimmedValue + ", ");
        }
        setShowSuggestions(false);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    };

    const isDisabled = disabled || isSubmitting;

    return (
      <EmailInputBase
        ref={ref}
        value={value}
        onInputChange={(newValue) => {
          onValueChange(newValue);
          setShowSuggestions(true);
          setHighlightedIndex(-1);
        }}
        showSuggestions={showSuggestions && filteredSuggestions.length > 0}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
          }, 150);
        }}
        onKeyDown={handleKeyDown}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
        onHighlightSuggestion={setHighlightedIndex}
        isLoadingSuggestions={isLoadingEmails}
        loadingText="Loading suggestions..."
        isDisabled={isDisabled}
        inputType="text"
        showCheckOnHighlight
        containerClassName={cn("space-y-3", containerClassName)}
        className={cn(
          hasInvalidEmails && "border-destructive focus-visible:ring-destructive",
          className
        )}
        afterInput={
          <>
            {/* Email validation badges */}
            {showValidationBadges && emailValidations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {emailValidations.map((validation, index) => (
                  <Badge
                    key={index}
                    variant={validation.isValid ? "secondary" : "destructive"}
                    className="gap-1.5 text-xs font-normal pr-1"
                  >
                    {validation.isValid ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {validation.email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(index)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-background/50 transition-colors"
                      aria-label={`Remove ${validation.email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Helper text */}
            <p className="text-xs text-muted-foreground">
              Comma-separated list of emails.{" "}
              {hasValidEmails && !hasInvalidEmails && (
                <span className="text-primary">
                  {emailValidations.length} valid recipient
                  {emailValidations.length > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </>
        }
        {...inputProps}
      />
    );
  }
);

MultiEmailAutocompleteInput.displayName = "MultiEmailAutocompleteInput";

export default MultiEmailAutocompleteInput;
