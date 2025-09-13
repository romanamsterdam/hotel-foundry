import React from 'react';
import { Users, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { RequiredStaffing } from '../../lib/staffing/types';
import { assessStaffingGap, getStatusIcon } from '../../lib/staffing/flags';

interface StaffingSummaryCardsProps {
  staffingData: RequiredStaffing[];
  assumptions: {
    hoursPerWeek: number;
    utilizationFactor: number;
  };
}

export default function StaffingSummaryCards({ staffingData, assumptions }: StaffingSummaryCardsProps) {
  const totalRequired = staffingData.reduce((sum, s) => sum + s.requiredFTE, 0);
  const totalProvided = staffingData.reduce((sum, s) => sum + s.providedFTE, 0);
  const totalGap = totalRequired - totalProvided;
  
  const issueCount = staffingData.filter(s => {
    const status = assessStaffingGap(s.gapFTE);
    return status !== 'ok';
  }).length;
  
  const criticalGaps = staffingData
    .filter(s => s.gapFTE > 0)
    .sort((a, b) => b.gapFTE - a.gapFTE)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total FTE Summary */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Total FTE Summary</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-slate-400 hover:text-slate-600">
                    <AlertTriangle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    FTE = full-time equivalent. 1 FTE is one person working full-time. 
                    We compare the hours your operation needs vs hours your staff can actually work after holidays and sick days.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Required FTE:</span>
              <span className="font-medium text-slate-900">{totalRequired.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-slate-600">Provided FTE:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button aria-label="What is included?" className="text-slate-400 hover:text-slate-600">
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[360px] text-sm">
                      <p><strong>What's counted here?</strong></p>
                      <p className="mt-1">Operating teams only: Front Office, Housekeeping, F&B Service, Kitchen, Bar, Wellness/Spa, Maintenance, Security.</p>
                      <p className="mt-1">Excluded: GM/Management, Admin/Finance, HR/IT, Sales & Marketing.</p>
                      <p className="mt-1">FTE is net of time off: we use your utilization ({Math.round(assumptions.utilizationFactor * 100)}%) → ≈{(assumptions.hoursPerWeek * assumptions.utilizationFactor).toFixed(0)} productive hrs/week per FTE.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-medium text-slate-900">{totalProvided.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-700 font-medium">Gap:</span>
              <span className={`font-semibold ${
                totalGap > 0 ? 'text-red-600' : totalGap < -0.3 ? 'text-blue-600' : 'text-green-600'
              }`}>
                {totalGap > 0 ? '+' : ''}{totalGap.toFixed(1)} FTE
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments with Issues */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Departments with Issues</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{issueCount}</div>
              <div className="text-sm text-slate-600">
                of {staffingData.length} departments
              </div>
            </div>
            {issueCount > 0 && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded p-2">
                Issues include understaffing, overstaffing, or coverage gaps
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Critical Gaps */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            <CardTitle className="text-base">Top Critical Gaps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {criticalGaps.length > 0 ? (
              criticalGaps.map((gap, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{gap.role}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-600 font-medium">+{gap.gapFTE.toFixed(1)}</span>
                    <span className="text-red-600">{getStatusIcon(assessStaffingGap(gap.gapFTE))}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-green-600">
                <div className="text-2xl">✅</div>
                <div>No critical gaps</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}