import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { formatScaledCurrency, Scale } from '../../lib/pl/format';
import { 
  assessDepartmentMargin, 
  assessGOPPercent, 
  getStatusColor, 
  getStatusIcon, 
  getStatusLabel,
  ThresholdStatus 
} from '../../lib/kpi/kpiCalcs';

interface RatioData {
  fbRevenue: number;
  fbCOGS: number;
  fbDirectPayroll: number;
  fbDirectCosts: number;
  wellnessRevenue: number;
  wellnessDirectPayroll: number;
  wellnessDirectCosts: number;
  wellnessOtherCosts: number;
  roomsRevenue: number;
  roomsDirectPayroll: number;
  roomsDirectCosts: number;
  roomsCommission: number;
  guestSupplies: number;
  totalRevenue: number;
  goi: number;
}

interface RatioFlagsTableProps {
  ratioData: RatioData;
  selectedYear: number;
  currency: string;
  scale: Scale;
}

interface RatioRow {
  id: string;
  label: string;
  value: number;
  isPercentage: boolean;
  status: ThresholdStatus;
  reason: string;
  tooltip: string;
}

export default function RatioFlagsTable({
  ratioData,
  selectedYear,
  currency,
  scale
}: RatioFlagsTableProps) {
  // Calculate departmental margins and ratios
  const ratioRows: RatioRow[] = React.useMemo(() => {
    const {
      fbRevenue,
      fbCOGS,
      fbDirectPayroll,
      fbDirectCosts,
      wellnessRevenue,
      wellnessDirectPayroll,
      wellnessDirectCosts,
      wellnessOtherCosts,
      roomsRevenue,
      roomsDirectPayroll,
      roomsDirectCosts,
      roomsCommission,
      guestSupplies,
      totalRevenue,
      goi
    } = ratioData;

    const rows: RatioRow[] = [];

    // F&B Department Profit
    const fbTotalCosts = fbCOGS + fbDirectPayroll + fbDirectCosts;
    const fbProfit = fbRevenue - fbTotalCosts;
    const fbMarginPct = fbRevenue > 0 ? (fbProfit / fbRevenue) * 100 : 0;
    const fbStatus = assessDepartmentMargin(fbMarginPct / 100, 'fb');
    
    let fbReason = '';
    if (fbProfit <= 0) fbReason = 'F&B costs exceed revenue';
    else if (fbMarginPct < 10) fbReason = 'Low margin (<10%)';
    else fbReason = 'Healthy margin';

    rows.push({
      id: 'fb-margin',
      label: 'F&B Department Margin',
      value: fbMarginPct,
      isPercentage: true,
      status: fbStatus,
      reason: fbReason,
      tooltip: 'F&B Revenue minus COGS, direct payroll, and direct costs. Healthy margins are typically 10%+.'
    });

    // Wellness Department Profit
    const wellnessTotalCosts = wellnessDirectPayroll + wellnessDirectCosts + wellnessOtherCosts;
    const wellnessProfit = wellnessRevenue - wellnessTotalCosts;
    const wellnessMarginPct = wellnessRevenue > 0 ? (wellnessProfit / wellnessRevenue) * 100 : 0;
    const wellnessStatus = assessDepartmentMargin(wellnessMarginPct / 100, 'wellness');
    
    let wellnessReason = '';
    if (wellnessProfit <= 0) wellnessReason = 'Wellness costs exceed revenue';
    else if (wellnessMarginPct < 10) wellnessReason = 'Low margin (<10%)';
    else wellnessReason = 'Healthy margin';

    rows.push({
      id: 'wellness-margin',
      label: 'Wellness Department Margin',
      value: wellnessMarginPct,
      isPercentage: true,
      status: wellnessStatus,
      reason: wellnessReason,
      tooltip: 'Wellness Revenue minus direct payroll, direct costs, and other wellness costs.'
    });

    // Rooms Department Margin
    const roomsTotalCosts = roomsDirectPayroll + roomsDirectCosts + roomsCommission + guestSupplies;
    const roomsProfit = roomsRevenue - roomsTotalCosts;
    const roomsMarginPct = roomsRevenue > 0 ? (roomsProfit / roomsRevenue) * 100 : 0;
    const roomsStatus = assessDepartmentMargin(roomsMarginPct / 100, 'rooms');
    
    let roomsReason = '';
    if (roomsMarginPct < 60) roomsReason = 'Below typical range (60-85%)';
    else roomsReason = 'Within typical range';

    rows.push({
      id: 'rooms-margin',
      label: 'Rooms Department Margin',
      value: roomsMarginPct,
      isPercentage: true,
      status: roomsStatus,
      reason: roomsReason,
      tooltip: 'Rooms Revenue minus direct payroll, direct costs, commissions, and guest supplies. Typical range: 60-85%.'
    });

    // GOP Percentage
    const gopPct = totalRevenue > 0 ? (goi / totalRevenue) * 100 : 0;
    const gopStatus = assessGOPPercent(gopPct / 100);
    
    let gopReason = '';
    if (gopPct < 20) gopReason = 'Below industry minimum';
    else if (gopPct > 55) gopReason = 'Unrealistically high';
    else gopReason = 'Within normal range';

    rows.push({
      id: 'gop-pct',
      label: 'GOP % (GOI ÷ Total Revenue)',
      value: gopPct,
      isPercentage: true,
      status: gopStatus,
      reason: gopReason,
      tooltip: 'Gross Operating Income as percentage of Total Revenue. Typical range: 20-55% for boutique hotels.'
    });

    return rows;
  }, [ratioData]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Ratio & Sanity Flags</h3>
          <p className="text-sm text-slate-600">
            Departmental margins and operational ratios for Year {selectedYear}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Metric</th>
              <th className="text-right py-3 px-4 font-medium text-slate-700">Value</th>
              <th className="text-center py-3 px-4 font-medium text-slate-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Assessment</th>
            </tr>
          </thead>
          <tbody>
            {ratioRows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-900">{row.label}</span>
                    <TooltipProvider>
                      <RadixTooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">{row.tooltip}</p>
                        </TooltipContent>
                      </RadixTooltip>
                    </TooltipProvider>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-medium text-slate-900">
                    {row.isPercentage 
                      ? `${row.value.toFixed(1)}%`
                      : formatScaledCurrency(row.value, currency, scale)
                    }
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(row.status)}`}>
                    <span className="text-lg">{getStatusIcon(row.status)}</span>
                    <span className="text-sm font-medium">{getStatusLabel(row.status)}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-600">{row.reason}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Benchmarks Note */}
      <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="text-sm text-slate-600">
          <strong>Benchmarks:</strong> Thresholds based on European boutique hotel industry standards. 
          Departmental margins should be positive with healthy spreads. GOP% typically ranges 20-55% depending on service level and market positioning.
        </div>
      </div>
    </div>
  );
}