import { forwardRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { User, X } from "lucide-react";
import { useEmailAutocomplete, type UseEmailAutocompleteOptions } from "@/hooks/useEmailAutocomplete";
import { cn } from "@/lib/utils";
import EmailInputBase from "./email-input-base";

export interface EmailAutocompleteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  /** Current email value (controlled) */
  value?: string;
  /** Callback when email changes */
  onValueChange?: (value: string) => void;
  /** Show "Send to myself" button */
  showSendToMyself?: boolean;
  /** Label for the "Send to myself" button */
  sendToMyselfLabel?: string;
  /** Whether the input is in a loading/disabled state */
  isSubmitting?: boolean;
  /** Options passed to the useEmailAutocomplete hook */
  autocompleteOptions?: UseEmailAutocompleteOptions;
  /** Custom class for the container */
  containerClassName?: string;
  /** Hide the clear button */
  hideClearButton?: boolean;
  /** Callback when an email is selected from suggestions */
  onEmailSelect?: (email: string) => void;
}

const EmailAutocompleteInput = forwardRef<HTMLInputElement, EmailAutocompleteInputProps>(
  (
    {
      value: controlledValue,
      onValueChange,
      showSendToMyself = false,
      sendToMyselfLabel = "Send to myself",
      isSubmitting = false,
      autocompleteOptions,
      containerClassName,
      hideClearButton = false,
      onEmailSelect,
      className,
      disabled,
      ...inputProps
    },
    ref
  ) => {
    const {
      value: hookValue,
      setValue: setHookValue,
      userEmail,
      isLoading: isLoadingEmails,
      showSuggestions,
      setShowSuggestions,
      highlightedIndex,
      setHighlightedIndex,
      filteredEmails,
      handleKeyDown,
      clearValue,
    } = useEmailAutocomplete(autocompleteOptions);

    // Support both controlled and uncontrolled modes
    const value = controlledValue !== undefined ? controlledValue : hookValue;
    const setValue = (newValue: string) => {
      if (onValueChange) {
        onValueChange(newValue);
      } else {
        setHookValue(newValue);
      }
    };

    const handleSelectEmail = (email: string) => {
      setValue(email);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      onEmailSelect?.(email);
    };

    const handleClear = () => {
      if (controlledValue !== undefined) {
        onValueChange?.("");
      } else {
        clearValue();
      }
      setHighlightedIndex(-1);
    };

    const handleFillWithUserEmail = () => {
      if (userEmail) {
        setValue(userEmail);
        onEmailSelect?.(userEmail);
      }
    };

    const isDisabled = disabled || isSubmitting;

    // Map filtered emails to suggestion items
    const suggestions = useMemo(
      () =>
        filteredEmails.map((email, index) => ({
          email,
          isHighlighted: index === highlightedIndex,
        })),
      [filteredEmails, highlightedIndex]
    );

    return (
      <EmailInputBase
        ref={ref}
        value={value}
        onInputChange={(newValue) => {
          setValue(newValue);
          setHighlightedIndex(-1);
        }}
        showSuggestions={showSuggestions}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
          }, 150);
        }}
        onKeyDown={handleKeyDown}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectEmail}
        onHighlightSuggestion={setHighlightedIndex}
        isLoadingSuggestions={isLoadingEmails}
        loadingText="Loading recent emails..."
        emptyText="No recent emails"
        isDisabled={isDisabled}
        inputType="email"
        containerClassName={containerClassName}
        className={cn(!hideClearButton && value && "pr-8", className)}
        beforeInput={
          showSendToMyself && userEmail ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleFillWithUserEmail}
                disabled={isDisabled}
              >
                <User className="h-3 w-3 mr-1" />
                {sendToMyselfLabel}
              </Button>
            </div>
          ) : undefined
        }
        inputAdornment={
          !hideClearButton && value && !isDisabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Clear email"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
        {...inputProps}
      />
    );
  }
);

EmailAutocompleteInput.displayName = "EmailAutocompleteInput";

export default EmailAutocompleteInput;
