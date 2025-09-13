import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Info } from 'lucide-react';
import { BUDGET_TOOLTIPS, BudgetTooltipKey } from '../config/budgetTooltips';

export function BudgetTooltip({ keyId, className }: { keyId: BudgetTooltipKey; className?: string }) {
  const t = BUDGET_TOOLTIPS[keyId];
  if (!t) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className={`h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help ${className ?? ''}`} />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="text-sm">
          <strong>What it means:</strong> {t.meaning}
          {t.applied && (
            <>
              <br />
              <strong>How it's applied:</strong> {t.applied}
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}