import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';
import { RequiredStaffing } from '../../lib/staffing/types';
import { DEPARTMENT_LABELS } from '../../lib/staffing/defaults';

interface CoverageHeatmapProps {
  staffingData: RequiredStaffing[];
}

const DAYPARTS = [
  { id: 'breakfast', label: 'Breakfast', hours: '7-10am' },
  { id: 'lunch', label: 'Lunch', hours: '12-4pm' },
  { id: 'dinner', label: 'Dinner', hours: '6-11pm' },
  { id: 'night', label: 'Night/Overnight', hours: '11pm-7am' },
  { id: 'allday', label: 'All Day', hours: '24/7' }
];

export default function CoverageHeatmap({ staffingData }: CoverageHeatmapProps) {
  // Calculate coverage percentage for each department/daypart combination
  const getCoveragePercentage = (dept: string, daypart: string): number | null => {
    const staffing = staffingData.find(s => s.dept === dept);
    if (!staffing) return null;
    
    // Simplified coverage calculation
    // In a full implementation, this would consider actual shift patterns
    const coverageRatio = staffing.requiredFTE > 0 ? 
      (staffing.providedFTE / staffing.requiredFTE) * 100 : 
      staffing.providedFTE > 0 ? 100 : 0;
    
    // Apply daypart-specific logic
    switch (dept) {
      case 'frontOffice':
        return daypart === 'allday' ? coverageRatio : null;
      case 'housekeeping':
        return daypart === 'breakfast' || daypart === 'lunch' ? coverageRatio : null;
      case 'fbService':
        return ['breakfast', 'lunch', 'dinner'].includes(daypart) ? coverageRatio : null;
      case 'kitchen':
        return ['breakfast', 'lunch', 'dinner'].includes(daypart) ? coverageRatio : null;
      case 'bar':
        return daypart === 'dinner' || daypart === 'night' ? coverageRatio : null;
      case 'wellness':
        return daypart === 'allday' ? coverageRatio : null;
      case 'security':
        return daypart === 'night' || daypart === 'allday' ? coverageRatio : null;
      default:
        return null;
    }
  };

  const getCoverageColor = (percentage: number | null): string => {
    if (percentage === null) return 'bg-slate-100 text-slate-400';
    if (percentage < 90) return 'bg-red-200 text-red-900';
    if (percentage <= 100) return 'bg-amber-200 text-amber-900';
    if (percentage <= 120) return 'bg-green-200 text-green-900';
    return 'bg-blue-200 text-blue-900';
  };

  const formatCoverage = (percentage: number | null): string => {
    if (percentage === null) return '—';
    return `${Math.round(percentage)}%`;
  };

  const getTooltipText = (dept: string, daypart: string, percentage: number | null): string => {
    if (percentage === null) return 'Not applicable for this department/daypart';
    
    const staffing = staffingData.find(s => s.dept === dept);
    const deptLabel = DEPARTMENT_LABELS[dept as keyof typeof DEPARTMENT_LABELS] || dept;
    const daypartLabel = DAYPARTS.find(d => d.id === daypart)?.label || daypart;
    
    return `${deptLabel} - ${daypartLabel}: ${Math.round(percentage)}% coverage
Required: ${staffing?.requiredFTE.toFixed(1)} FTE
Provided: ${staffing?.providedFTE.toFixed(1)} FTE`;
  };

  const departments = Object.keys(DEPARTMENT_LABELS);

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg">Coverage Heatmap</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Shows staffing coverage by department and time period. 
                  Red &lt; 90%, Amber 90-100%, Green 100-120%, Blue &gt; 120%.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header Row */}
            <div className="grid grid-cols-6 gap-1 mb-2">
              <div className="text-xs font-medium text-slate-600 p-2">Department</div>
              {DAYPARTS.map((daypart) => (
                <div key={daypart.id} className="text-xs font-medium text-slate-600 text-center p-2">
                  <div>{daypart.label}</div>
                  <div className="text-slate-400">{daypart.hours}</div>
                </div>
              ))}
            </div>
            
            {/* Data Rows */}
            {departments.map((dept) => {
              const deptLabel = DEPARTMENT_LABELS[dept as keyof typeof DEPARTMENT_LABELS];
              
              return (
                <div key={dept} className="grid grid-cols-6 gap-1 mb-1">
                  <div className="text-sm font-medium text-slate-900 p-2 bg-slate-50 rounded">
                    {deptLabel}
                  </div>
                  {DAYPARTS.map((daypart) => {
                    const percentage = getCoveragePercentage(dept, daypart.id);
                    
                    return (
                      <TooltipProvider key={daypart.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`text-xs font-medium text-center p-2 rounded cursor-help transition-all hover:scale-105 ${getCoverageColor(percentage)}`}
                            >
                              {formatCoverage(percentage)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {getTooltipText(dept, daypart.id, percentage)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-200 rounded"></div>
              <span>&lt; 90%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-amber-200 rounded"></div>
              <span>90-100%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span>100-120%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>&gt; 120%</span>
            </div>
          </div>
          <span>Coverage = Provided FTE ÷ Required FTE</span>
        </div>
      </CardContent>
    </Card>
  );
}