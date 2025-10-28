import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RepairAction } from '@/types/formatter';
import { cn } from '@/lib/utils';

interface RepairLogProps {
  repairs: RepairAction[];
  className?: string;
}

export function RepairLog({ repairs, className }: RepairLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (repairs.length === 0) return null;

  const getRepairDescription = (action: RepairAction): string => {
    switch (action.type) {
      case 'trim':
        return `Trimmed ${action.chars} leading/trailing characters`;
      case 'substring':
        return `Extracted JSON substring (${action.start} to ${action.end})`;
      case 'remove_trailing_commas':
        return `Removed ${action.count} trailing comma${action.count > 1 ? 's' : ''}`;
      case 'single_quote_to_double':
        return `Converted ${action.count} single quote${action.count > 1 ? 's' : ''} to double quotes`;
      case 'removed_comments':
        return `Removed ${action.count} comment${action.count > 1 ? 's' : ''}`;
      case 'removed_leading_garbage':
        return `Removed ${action.chars} leading garbage characters`;
      case 'bracket_matching':
        return `Extracted ${action.extracted} chars from ${action.original} using bracket matching`;
      default:
        return 'Unknown repair action';
    }
  };

  return (
    <div className={cn('bg-warning/5 border border-warning/20 rounded-lg', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between p-4 h-auto hover:bg-warning/10"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} repair log`}
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">
            {repairs.length} repair{repairs.length > 1 ? 's' : ''} applied
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {repairs.map((repair, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className="text-warning font-medium min-w-[1.5rem]">
                {index + 1}.
              </span>
              <span>{getRepairDescription(repair)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
