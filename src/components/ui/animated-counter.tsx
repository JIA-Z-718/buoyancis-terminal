import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  showChangeIndicator?: boolean;
  pulseClassName?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 500, 
  className,
  showChangeIndicator = true,
  pulseClassName = "animate-pulse-glow",
}: AnimatedCounterProps) {
  const { displayValue, changeDirection, changeAmount, isSignificantChange } = useAnimatedCounter(value, { duration });
  
  const formatChangeAmount = (amount: number | null) => {
    if (amount === null) return "";
    return amount > 0 ? `+${amount.toLocaleString()}` : amount.toLocaleString();
  };
  
  return (
    <span 
      className={cn(
        "tabular-nums inline-flex items-center gap-1 transition-all duration-300",
        isSignificantChange && pulseClassName,
        className
      )}
    >
      {displayValue.toLocaleString()}
      {showChangeIndicator && changeDirection && changeAmount !== null && (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex items-center animate-fade-in cursor-help",
                  changeDirection === "up" ? "text-green-500" : "text-red-500"
                )}
              >
                {changeDirection === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className={cn(
                "font-medium",
                changeDirection === "up" ? "text-green-500" : "text-red-500"
              )}
            >
              {formatChangeAmount(changeAmount)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}
