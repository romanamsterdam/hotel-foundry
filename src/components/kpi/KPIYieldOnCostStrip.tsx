import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { formatScaledCurrency, Scale } from '../../lib/pl/format';
import { assessYieldOnCost, getStatusColor, getStatusIcon } from '../../lib/kpi/kpiCalcs';

interface KPIYieldOnCostStripProps {
  totalInvestment: number;
  ebitdaByYear: number[];
  exitYear: number;
  currency: string;
  scale: Scale;
}

export default function KPIYieldOnCostStrip({
  totalInvestment,
  ebitdaByYear,
  exitYear,
  currency,
  scale
}: KPIYieldOnCostStripProps) {
  // Calculate Yield on Cost for Years 3-5
  const yocData = React.useMemo(() => {
    const years = [3, 4, 5].filter(year => year <= exitYear);
    
    return years.map(year => {
      const ebitda = ebitdaByYear[year - 1] || 0;
      const yoc = totalInvestment > 0 ? ebitda / totalInvestment : 0;
      const status = assessYieldOnCost(yoc);
      
      return {
        year,
        ebitda,
        yoc,
        yocPct: yoc * 100,
        status
      };
    });
  }, [totalInvestment, ebitdaByYear, exitYear]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Investment & Yield Analysis</h3>
          <p className="text-sm text-slate-600">Total investment and stabilized yield on cost</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Investment */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-slate-700">Total Project Cost</span>
            <TooltipProvider>
              <RadixTooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Total capital invested including acquisition, construction, and development costs.
                  </p>
                </TooltipContent>
              </RadixTooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatScaledCurrency(totalInvestment, currency, scale)}
          </div>
        </div>

        {/* Yield on Cost for Years 3-5 */}
        {yocData.map(({ year, ebitda, yocPct, status }) => (
          <div key={year} className={`rounded-xl border p-4 ${getStatusColor(status)}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium">Year {year} Yield on Cost</span>
              <span className="text-lg">{getStatusIcon(status)}</span>
              <TooltipProvider>
                <RadixTooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help opacity-70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs text-sm space-y-2">
                      <p className="font-semibold">Yield on Cost (YoC)</p>
                      <p>EBITDA divided by invested capital - a proxy for stabilized return on cost.</p>
                      <div className="border-t pt-2 space-y-1">
                        <p className="font-medium">Benchmarks:</p>
                        <p>• ≥10%: Good (Green)</p>
                        <p>• 7-10%: OK (Amber)</p>
                        <p>• &lt;7%: Weak (Red)</p>
                      </div>
                      <p className="text-xs">
                        Year {year}: {formatScaledCurrency(ebitda, currency, scale)} ÷ {formatScaledCurrency(totalInvestment, currency, scale)} = {yocPct.toFixed(1)}%
                      </p>
                    </div>
                  </TooltipContent>
                </RadixTooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold">
              {yocPct.toFixed(1)}%
            </div>
            <div className="text-xs mt-1 opacity-80">
              EBITDA: {formatScaledCurrency(ebitda, currency, scale)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}