import { forwardRef, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SuggestionItem {
  email: string;
  isHighlighted: boolean;
}

export interface EmailInputBaseProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  /** Current input value */
  value: string;
  /** Callback when value changes */
  onInputChange: (value: string) => void;
  /** Whether suggestions dropdown is visible */
  showSuggestions: boolean;
  /** Callback when focus triggers suggestions */
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Callback when blur should hide suggestions */
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Keyboard event handler */
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** List of filtered suggestions to display */
  suggestions: SuggestionItem[];
  /** Callback when a suggestion is selected */
  onSelectSuggestion: (email: string) => void;
  /** Callback when mouse enters a suggestion */
  onHighlightSuggestion: (index: number) => void;
  /** Whether suggestions are loading */
  isLoadingSuggestions?: boolean;
  /** Loading text for suggestions */
  loadingText?: string;
  /** Empty state text when no suggestions */
  emptyText?: string;
  /** Whether the input is disabled */
  isDisabled?: boolean;
  /** Input type (email or text for multi-email) */
  inputType?: "email" | "text";
  /** Show checkmark on highlighted suggestions */
  showCheckOnHighlight?: boolean;
  /** Custom class for the dropdown */
  dropdownClassName?: string;
  /** Content to render before the input (e.g., "Send to myself" button) */
  beforeInput?: ReactNode;
  /** Content to render inside the input container (e.g., clear button) */
  inputAdornment?: ReactNode;
  /** Content to render after the input container (e.g., validation badges) */
  afterInput?: ReactNode;
  /** Custom class for the container */
  containerClassName?: string;
}

const EmailInputBase = forwardRef<HTMLInputElement, EmailInputBaseProps>(
  (
    {
      value,
      onInputChange,
      showSuggestions,
      onFocus,
      onBlur,
      onKeyDown,
      suggestions,
      onSelectSuggestion,
      onHighlightSuggestion,
      isLoadingSuggestions = false,
      loadingText = "Loading suggestions...",
      emptyText = "No recent emails",
      isDisabled = false,
      inputType = "email",
      showCheckOnHighlight = false,
      dropdownClassName,
      beforeInput,
      inputAdornment,
      afterInput,
      containerClassName,
      className,
      ...inputProps
    },
    ref
  ) => {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {beforeInput}
        <div className="relative">
          <Input
            ref={ref}
            type={inputType}
            value={value}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoComplete="off"
            disabled={isDisabled}
            className={className}
            {...inputProps}
          />
          {inputAdornment}
          {showSuggestions && (
            <div
              className={cn(
                "absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50 max-h-48 overflow-auto",
                dropdownClassName
              )}
            >
              {isLoadingSuggestions ? (
                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {loadingText}
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item, index) => (
                  <button
                    key={item.email}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2",
                      item.isHighlighted
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectSuggestion(item.email);
                    }}
                    onMouseEnter={() => onHighlightSuggestion(index)}
                  >
                    {showCheckOnHighlight && (
                      <Check
                        className={cn(
                          "h-3 w-3 text-primary",
                          item.isHighlighted ? "opacity-100" : "opacity-0"
                        )}
                      />
                    )}
                    {item.email}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {emptyText}
                </div>
              )}
            </div>
          )}
        </div>
        {afterInput}
      </div>
    );
  }
);

EmailInputBase.displayName = "EmailInputBase";

export default EmailInputBase;
