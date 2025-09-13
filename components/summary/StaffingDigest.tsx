import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info, Users } from 'lucide-react';
import { staffingDigest } from '../../lib/summary/narrative';

interface StaffingDigestProps {
  providedFTE: number;
  requiredFTE: number;
  topGaps: Array<{
    role: string;
    gap: number;
    dept: string;
  }>;
}

export default function StaffingDigest({ providedFTE, requiredFTE, topGaps }: StaffingDigestProps) {
  const narrative = staffingDigest(providedFTE, requiredFTE, topGaps);
  const totalGap = requiredFTE - providedFTE;
  
  const getGapStatus = () => {
    if (totalGap >= 0.5) return { color: 'text-red-600 bg-red-50 border-red-200', icon: '⛔' };
    if (totalGap >= 0.2) return { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: '⚠️' };
    if (totalGap <= -0.5) return { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '🔵' };
    return { color: 'text-green-600 bg-green-50 border-green-200', icon: '✅' };
  };

  const gapStatus = getGapStatus();

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-slate-600" />
          <CardTitle className="text-lg">Staffing Digest</CardTitle>
          <TooltipProvider>
            <RadixTooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  We translate opening hours & activity into hours of work and check if the team covers it after holidays & absences.
                </p>
              </TooltipContent>
            </RadixTooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Narrative */}
        <p className="text-slate-700">{narrative}</p>

        {/* Status Overview */}
        <div className="flex items-center space-x-4">
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border ${gapStatus.color}`}>
            <span className="text-lg">{gapStatus.icon}</span>
            <div className="text-sm font-semibold">
              {totalGap > 0 ? `${totalGap.toFixed(1)} FTE Short` : 
               totalGap < -0.3 ? `${Math.abs(totalGap).toFixed(1)} FTE Over` : 
               'Balanced'}
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            {providedFTE.toFixed(1)} provided / {requiredFTE.toFixed(1)} required
          </Badge>
        </div>

        {/* Top Gaps */}
        {topGaps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-2">Top Staffing Gaps</h4>
            <div className="space-y-2">
              {topGaps.slice(0, 3).map((gap, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{gap.role}</span>
                  <span className="text-red-600 font-medium">+{gap.gap.toFixed(1)} FTE</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Actions */}
        {topGaps.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3">
            <h5 className="text-sm font-medium text-slate-900 mb-2">Suggested Actions</h5>
            <ul className="text-sm text-slate-600 space-y-1">
              {topGaps.slice(0, 3).map((gap, index) => (
                <li key={index}>
                  • {gap.gap >= 0.5 ? `Hire additional ${gap.role.toLowerCase()} (+${gap.gap.toFixed(1)} FTE)` :
                      gap.gap >= 0.2 ? `Extend hours for ${gap.role.toLowerCase()} (+${gap.gap.toFixed(1)} FTE)` :
                      `Consider part-time coverage for ${gap.role.toLowerCase()}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}