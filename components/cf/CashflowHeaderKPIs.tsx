import { formatCurrency } from '../../lib/utils';
import { CashFlowKPIs } from '../../lib/finance/cashflow';
import { formatIRR } from '../../lib/finance/irr';
import { computeProjectIrrsWithHorizon } from '../../lib/finance/cashflow';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';

interface CashflowHeaderKPIsProps {
  dealId: string;
  exitYear: number | null;
  currency: string;
}

export default function CashflowHeaderKPIs({ dealId, exitYear, currency }: CashflowHeaderKPIsProps) {
  const holdPeriod = exitYear || 10;
  
  // Get IRRs using the same calculation as Exit Strategy
  const { unleveredIrr, leveredIrr } = computeProjectIrrsWithHorizon(dealId, { 
    throughYearIndex: holdPeriod 
  });

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cash Flow Summary</h2>
          <p className="text-sm text-slate-600">
            {holdPeriod}-year investment analysis {exitYear ? `(exit Year ${exitYear})` : '(hold forever)'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-blue-700">{holdPeriod}-Year Unlevered CF</span>
            <TooltipProvider>
              <RadixTooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-blue-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Property cash flow before financing—driven by operations, capex, and taxes; excludes debt.
                  </p>
                </TooltipContent>
              </RadixTooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl lg:text-2xl font-bold text-blue-900">
            {formatCurrency(0, currency)}
          </div>
          <div className="text-xs text-blue-600 mt-1">Sum over hold period</div>
        </div>
        
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-green-700">{holdPeriod}-Year Levered CF</span>
            <TooltipProvider>
              <RadixTooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-green-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Cash flow to equity after financing—includes debt service and loan repayments.
                  </p>
                </TooltipContent>
              </RadixTooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl lg:text-2xl font-bold text-green-900">
            {formatCurrency(0, currency)}
          </div>
          <div className="text-xs text-green-600 mt-1">Sum over hold period</div>
        </div>
        
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-purple-700">Unlevered IRR</span>
            <TooltipProvider>
              <RadixTooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-purple-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    IRR is the annualized rate of return that sets the net present value of all cash flows (equity invested and equity returned) to zero.
                  </p>
                </TooltipContent>
              </RadixTooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl lg:text-2xl font-bold text-purple-900">
            {formatIRR(unleveredIrr)}
          </div>
        </div>
        
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-amber-700">Levered IRR</span>
            <TooltipProvider>
              <RadixTooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-amber-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    IRR on equity investment after debt financing effects. Higher leverage can amplify returns.
                  </p>
                </TooltipContent>
              </RadixTooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl lg:text-2xl font-bold text-amber-900">
            {formatIRR(leveredIrr)}
          </div>
        </div>
      </div>
    </div>
  );
}