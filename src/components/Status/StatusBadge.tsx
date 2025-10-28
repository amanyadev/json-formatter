import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { FormatResult } from '@/types/formatter';

interface StatusBadgeProps {
  result: FormatResult | null;
  className?: string;
}

export function StatusBadge({ result, className }: StatusBadgeProps) {
  if (!result) return null;

  const getStatusConfig = () => {
    if (!result.ok) {
      return {
        icon: XCircle,
        label: 'Unrecoverable',
        bgClass: 'bg-destructive/10 text-destructive',
        iconClass: 'text-destructive',
      };
    }

    if (result.repairs.length === 0) {
      return {
        icon: CheckCircle2,
        label: 'Valid JSON',
        bgClass: 'bg-success/10 text-success',
        iconClass: 'text-success',
      };
    }

    return {
      icon: AlertTriangle,
      label: `Recovered (${result.confidence})`,
      bgClass: 'bg-warning/10 text-warning',
      iconClass: 'text-warning',
    };
  };

  const { icon: Icon, label, bgClass, iconClass } = getStatusConfig();

  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', bgClass, className)}>
      <Icon className={cn('w-4 h-4', iconClass)} />
      <span>{label}</span>
    </div>
  );
}
