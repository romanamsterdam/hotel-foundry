import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Target, Info, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';

interface ExitPlanCardProps {
  deal: Deal;
  exitYear: number;
  impliedExitValue: number;
  netSaleProceeds: number;
}

export default function ExitPlanCard({ deal, exitYear, impliedExitValue, netSaleProceeds }: ExitPlanCardProps) {
  const exitSettings = deal.assumptions?.exitSettings;
  
  if (!exitSettings) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800 font-medium">Exit strategy not configured yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStrategyBadge = () => {
    switch (exitSettings.strategy) {
      case 'SALE':
        return <Badge className="bg-blue-100 text-blue-700">Sale Exit</Badge>;
      case 'REFINANCE':
        return <Badge className="bg-purple-100 text-purple-700">Refinance</Badge>;
      case 'HOLD_FOREVER':
        return <Badge className="bg-green-100 text-green-700">Hold Forever</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  const getStrategyDescription = () => {
    switch (exitSettings.strategy) {
      case 'SALE':
        return `Sell property at end of Year ${exitYear} at ${exitSettings.sale.exitCapRate}% cap rate`;
      case 'REFINANCE':
        return `Refinance in Year ${exitSettings.refinance.refinanceYear} at ${exitSettings.refinance.ltvAtRefinance}% LTV`;
      case 'HOLD_FOREVER':
        return 'Long-term hold strategy focused on cash flow generation';
      default:
        return 'Exit strategy not configured';
    }
  };

  // Cross-check logic (simplified)
  const projectCost = deal.budget?.grandTotal || 0;
  const expectedMultiple = projectCost > 0 ? netSaleProceeds / projectCost : 0;
  const isReasonable = expectedMultiple >= 1.2 && expectedMultiple <= 3.0;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Exit Plan</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy Overview */}
        <div className="flex items-center space-x-3">
          {getStrategyBadge()}
          <span className="text-sm text-slate-700">{getStrategyDescription()}</span>
        </div>

        {/* Exit Details (for Sale strategy) */}
        {exitSettings.strategy === 'SALE' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Exit Year:</span>
                <span className="font-medium text-slate-900">Year {exitYear}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Exit Cap Rate:</span>
                <span className="font-medium text-slate-900">{exitSettings.sale.exitCapRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Selling Costs:</span>
                <span className="font-medium text-slate-900">{exitSettings.sale.sellingCostsPct}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Implied Exit Value:</span>
                <span className="font-medium text-slate-900">{formatCurrency(impliedExitValue, deal.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Net Sale Proceeds:</span>
                <span className="font-medium text-slate-900">{formatCurrency(netSaleProceeds, deal.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Return Multiple:</span>
                <span className="font-medium text-slate-900">{expectedMultiple.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        )}

        {/* Refinance Details */}
        {exitSettings.strategy === 'REFINANCE' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Refinance Year:</span>
                <span className="font-medium text-slate-900">Year {exitSettings.refinance.refinanceYear}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">New LTV:</span>
                <span className="font-medium text-slate-900">{exitSettings.refinance.ltvAtRefinance}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Refinance Costs:</span>
                <span className="font-medium text-slate-900">{exitSettings.refinance.refinanceCostsPct}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Net Cash Out:</span>
                <span className={`font-medium text-slate-900 ${netSaleProceeds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netSaleProceeds, deal.currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cross-check */}
        {exitSettings.strategy === 'SALE' && (
          <div className={`rounded-lg border p-3 ${
            isReasonable 
              ? 'border-green-200 bg-green-50' 
              : 'border-amber-200 bg-amber-50'
          }`}>
            <div className="flex items-center space-x-2">
              {isReasonable ? (
                <>
                  <span className="text-green-600">✅</span>
                  <span className="text-sm text-green-800 font-medium">
                    Exit valuation appears reasonable ({expectedMultiple.toFixed(1)}x return multiple)
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800 font-medium">
                    Exit assumptions may need review (return multiple: {expectedMultiple.toFixed(1)}x)
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}