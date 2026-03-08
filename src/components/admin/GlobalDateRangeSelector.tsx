import { Calendar, RotateCcw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { useDateRange, DATE_RANGE_OPTIONS } from "@/contexts/DateRangeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GlobalDateRangeSelectorProps {
  className?: string;
}

export default function GlobalDateRangeSelector({ className }: GlobalDateRangeSelectorProps) {
  const { selectedDays, setSelectedDays, resetToDefault, hasStoredPreference } = useDateRange();

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <ToggleGroup
                type="single"
                value={selectedDays}
                onValueChange={(value) => value && setSelectedDays(value)}
                size="sm"
              >
                {DATE_RANGE_OPTIONS.map((option) => (
                  <ToggleGroupItem 
                    key={option.value} 
                    value={option.value} 
                    aria-label={`Show last ${option.label}`}
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Global date range for all charts</p>
          </TooltipContent>
        </Tooltip>
        
        {hasStoredPreference && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefault}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="sr-only">Reset to default</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset to default (30 days)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
