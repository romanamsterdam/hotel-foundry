import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { assessIRR, assessMultiple, getStatusColor, getStatusIcon } from '../../lib/summary/thresholds';

interface ReturnsOverviewProps {
  leveredIRR: number;
  unleveredIRR: number;
  equityMultiple: number;
  leveredCFSum: number;
  unleveredCFSum: number;
  currency: string;
  hasDebt: boolean;
}

export default function ReturnsOverview({
  leveredIRR,
  unleveredIRR,
  equityMultiple,
  leveredCFSum,
  unleveredCFSum,
  currency,
  hasDebt
}: ReturnsOverviewProps) {
  const primaryIRR = hasDebt ? leveredIRR : unleveredIRR;
  const primaryIRRStatus = assessIRR(primaryIRR);
  const multipleStatus = assessMultiple(equityMultiple);

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Returns Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Primary IRR */}
          <div className={`rounded-xl border p-4 ${getStatusColor(primaryIRRStatus)}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium">
                {hasDebt ? 'Levered' : 'Unlevered'} IRR
              </span>
              <span className="text-lg">{getStatusIcon(primaryIRRStatus)}</span>
              <TooltipProvider>
                <RadixTooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help opacity-70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Annualized return considering all cash in/out. 
                      {hasDebt ? 'Levered includes debt financing effects.' : 'Unlevered assumes all-cash investment.'}
                    </p>
                  </TooltipContent>
                </RadixTooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold">
              {(primaryIRR * 100).toFixed(1)}%
            </div>
          </div>

          {/* Secondary IRR (if debt exists) */}
          {hasDebt && (
            <div className={`rounded-xl border p-4 ${getStatusColor(assessIRR(unleveredIRR))}`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium">Unlevered IRR</span>
                <span className="text-lg">{getStatusIcon(assessIRR(unleveredIRR))}</span>
              </div>
              <div className="text-2xl font-bold">
                {(unleveredIRR * 100).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Equity Multiple */}
          <div className={`rounded-xl border p-4 ${getStatusColor(multipleStatus)}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium">Equity Multiple</span>
              <span className="text-lg">{getStatusIcon(multipleStatus)}</span>
              <TooltipProvider>
                <RadixTooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help opacity-70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Total cash back ÷ equity invested. Shows how many times you multiply your initial investment.
                    </p>
                  </TooltipContent>
                </RadixTooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold">
              {equityMultiple.toFixed(1)}x
            </div>
          </div>

          {/* Total Cash Flow */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-slate-700">
                {hasDebt ? 'Levered' : 'Unlevered'} CF Sum
              </span>
              <TooltipProvider>
                <RadixTooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Total cash flow over the investment period including exit proceeds.
                    </p>
                  </TooltipContent>
                </RadixTooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(hasDebt ? leveredCFSum : unleveredCFSum, currency)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}