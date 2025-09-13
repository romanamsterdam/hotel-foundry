import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';
import type { RequiredStaffing } from '../../lib/staffing/types';
import { assessStaffingGap, getStatusColor, getStatusIcon, getStatusLabel, getSuggestedAction } from '../../lib/staffing/flags';
import { DEPARTMENT_LABELS } from '../../lib/staffing/defaults';
import { getBenchmarkText, getCalculationSummary } from '../../lib/staffing/benchmarks';

interface RoleGapTableProps {
  staffingData: RequiredStaffing[];
  assumptions: any;
  roomsSoldPerDay: number;
  overrides: any;
}

export default function RoleGapTable({ staffingData, assumptions, roomsSoldPerDay, overrides }: RoleGapTableProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg">Role Gap Analysis</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Detailed breakdown of staffing requirements vs current allocation by role. 
                  Positive gaps indicate understaffing, negative gaps indicate overstaffing.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Department</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Role</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Required FTE</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Provided FTE</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Gap</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {staffingData.map((staffing, index) => {
                const status = assessStaffingGap(staffing.gapFTE);
                const deptLabel = DEPARTMENT_LABELS[staffing.dept as keyof typeof DEPARTMENT_LABELS] || staffing.dept;
                
                return (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-slate-900">{deptLabel}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-sm text-slate-900">{staffing.role}</span>
                        <div className="text-xs text-slate-500">
                          {getCalculationSummary(staffing.dept, assumptions, roomsSoldPerDay, overrides)}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="ml-2 underline text-slate-400 hover:text-slate-600">
                                  Benchmark
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px] text-xs">
                                {getBenchmarkText(staffing.dept, staffing.role)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium text-slate-900">
                        {staffing.requiredFTE.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium text-slate-900">
                        {staffing.providedFTE.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${
                        staffing.gapFTE > 0 ? 'text-red-600' : 
                        staffing.gapFTE < -0.3 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {staffing.gapFTE > 0 ? '+' : ''}{staffing.gapFTE.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                        <span className="text-sm">{getStatusIcon(status)}</span>
                        <span className="text-sm font-medium">{getStatusLabel(status)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">
                        {getSuggestedAction(staffing)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {staffingData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">No staffing data available. Configure payroll in the Payroll Model section.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}