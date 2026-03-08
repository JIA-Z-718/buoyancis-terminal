import { formatDistanceToNow, format } from "date-fns";
import { useRelativeTimeRefresh } from "@/hooks/useRelativeTimeRefresh";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RelativeTimeProps {
  date: Date | string;
  addSuffix?: boolean;
  className?: string;
  showTooltip?: boolean;
  tooltipFormat?: string;
  refreshInterval?: number;
}

/**
 * Component that displays a relative timestamp (e.g., "5 minutes ago")
 * with automatic refresh every minute to keep it accurate.
 * 
 * Optionally shows the absolute time in a tooltip.
 */
export default function RelativeTime({
  date,
  addSuffix = true,
  className = "",
  showTooltip = true,
  tooltipFormat = "PPpp",
  refreshInterval = 60000,
}: RelativeTimeProps) {
  // This triggers a re-render every interval
  useRelativeTimeRefresh(refreshInterval);

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const relativeText = formatDistanceToNow(dateObj, { addSuffix });
  const absoluteText = format(dateObj, tooltipFormat);

  if (!showTooltip) {
    return <span className={className}>{relativeText}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className}`}>{relativeText}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{absoluteText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
