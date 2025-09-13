import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { TrendingUp, Info } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface UpsideLever {
  label: string;
  description: string;
  uplift: number;
  currency: string;
}

interface UpsideLeversProps {
  roomsRevenue: number;
  fnbRevenue: number;
  totalRevenue: number;
  currency: string;
  rooms: number;
}

export default function UpsideLevers({ 
  roomsRevenue, 
  fnbRevenue, 
  totalRevenue, 
  currency, 
  rooms 
}: UpsideLeversProps) {
  // Calculate potential uplifts
  const levers: UpsideLever[] = [
    {
      label: '+1pp Occupancy',
      description: 'Increase average occupancy by 1 percentage point',
      uplift: roomsRevenue * 0.014, // Rough approximation: 1pp occ ≈ 1.4% revenue increase
      currency
    },
    {
      label: '+€5 ADR',
      description: 'Increase average daily rate by €5',
      uplift: rooms * 365 * 0.7 * 5, // Assume 70% occupancy baseline
      currency
    },
    {
      label: '+5% F&B Capture',
      description: 'Increase guest F&B participation by 5 percentage points',
      uplift: fnbRevenue * 0.05, // 5% increase in F&B revenue
      currency
    },
    {
      label: '+10% External F&B',
      description: 'Increase external customer covers by 10%',
      uplift: fnbRevenue * 0.1 * 0.4, // Assume 40% of F&B is external
      currency
    },
    {
      label: '-2% Operating Costs',
      description: 'Reduce operating expenses through efficiency gains',
      uplift: totalRevenue * 0.02, // 2% of revenue saved
      currency
    }
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Upside Levers</CardTitle>
          <TooltipProvider>
            <RadixTooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Quick wins and operational improvements that could boost returns. 
                  These are directional estimates, not guarantees.
                </p>
              </TooltipContent>
            </RadixTooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {levers.map((lever, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-900">{lever.label}</div>
                <div className="text-xs text-slate-600">{lever.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">
                  +{formatCurrency(lever.uplift, currency)}/year
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-3">
          <strong>Disclaimer:</strong> Upside estimates are directional and based on industry benchmarks. 
          Actual results depend on execution, market conditions, and competitive dynamics.
        </div>
      </CardContent>
    </Card>
  );
}