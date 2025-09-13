import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';
import { shortExec } from '../../lib/summary/narrative';
import { assessYoC, assessIRR, assessMultiple, getStatusColor, getStatusIcon } from '../../lib/summary/thresholds';

interface ExecSummaryCardProps {
  dealName: string;
  irr: number;
  multiple: number;
  yocY4?: number;
  isLevered: boolean;
}

export default function ExecSummaryCard({ dealName, irr, multiple, yocY4, isLevered }: ExecSummaryCardProps) {
  const narrative = shortExec(dealName, irr, multiple, yocY4);
  
  const irrStatus = assessIRR(irr);
  const multipleStatus = assessMultiple(multiple);
  const yocStatus = yocY4 ? assessYoC(yocY4) : null;

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50">
      <CardHeader>
        <CardTitle className="text-xl">Executive Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-generated narrative */}
        <div className="text-slate-700 leading-relaxed">
          {narrative}
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-3">
          {/* IRR Status */}
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border ${getStatusColor(irrStatus)}`}>
            <span className="text-lg">{getStatusIcon(irrStatus)}</span>
            <div>
              <div className="text-sm font-semibold">
                {isLevered ? 'Levered' : 'Unlevered'} IRR: {(irr * 100).toFixed(1)}%
              </div>
              <TooltipProvider>
                <RadixTooltip>
                  <TooltipTrigger asChild>
                    <button className="text-xs opacity-70 hover:opacity-100 flex items-center space-x-1">
                      <Info className="h-3 w-3" />
                      <span>What's this?</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      IRR is the annualized return that balances all money in and out. 
                      {isLevered ? ' Levered includes debt financing effects.' : ' Unlevered assumes all-cash investment.'}
                    </p>
                  </TooltipContent>
                </RadixTooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Equity Multiple */}
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border ${getStatusColor(multipleStatus)}`}>
            <span className="text-lg">{getStatusIcon(multipleStatus)}</span>
            <div>
              <div className="text-sm font-semibold">
                Equity Multiple: {multiple.toFixed(1)}x
              </div>
              <TooltipProvider>
                <RadixTooltip>
                  <TooltipTrigger asChild>
                    <button className="text-xs opacity-70 hover:opacity-100 flex items-center space-x-1">
                      <Info className="h-3 w-3" />
                      <span>What's this?</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      How many times your initial equity you get back. 
                      2.0x means you double your money over the project life.
                    </p>
                  </TooltipContent>
                </RadixTooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Yield on Cost (if available) */}
          {yocY4 && yocStatus && (
            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border ${getStatusColor(yocStatus)}`}>
              <span className="text-lg">{getStatusIcon(yocStatus)}</span>
              <div>
                <div className="text-sm font-semibold">
                  Year 4 YoC: {(yocY4 * 100).toFixed(1)}%
                </div>
                <TooltipProvider>
                  <RadixTooltip>
                    <TooltipTrigger asChild>
                      <button className="text-xs opacity-70 hover:opacity-100 flex items-center space-x-1">
                        <Info className="h-3 w-3" />
                        <span>What's this?</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">
                        YoC is profit vs total cost. 10% means €10 back each year for every €100 invested, before financing.
                      </p>
                    </TooltipContent>
                  </RadixTooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}