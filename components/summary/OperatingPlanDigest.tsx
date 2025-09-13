import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';
import { occAdrDigest, gopBand, fnbDigest } from '../../lib/summary/narrative';
import { assessGOP, getStatusColor, getStatusIcon } from '../../lib/summary/thresholds';

interface OperatingPlanDigestProps {
  occY3: number;
  adrY3: number;
  revparY3: number;
  gopPctY3: number;
  fnbRevenueY3: number;
  fnbMarginY3: number;
  currency: string;
}

export default function OperatingPlanDigest({
  occY3,
  adrY3,
  revparY3,
  gopPctY3,
  fnbRevenueY3,
  fnbMarginY3,
  currency
}: OperatingPlanDigestProps) {
  const occAdrText = occAdrDigest(occY3, adrY3, revparY3);
  const gopText = gopBand(gopPctY3);
  const fnbText = fnbDigest(fnbRevenueY3, fnbMarginY3, currency);
  
  const gopStatus = assessGOP(gopPctY3);

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Operating Plan Digest</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operating narrative */}
        <div className="space-y-3 text-slate-700">
          <p>{occAdrText}</p>
          <p>{fnbText}</p>
        </div>

        {/* GOP Status */}
        <div className="flex items-center space-x-3">
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border ${getStatusColor(gopStatus)}`}>
            <span className="text-lg">{getStatusIcon(gopStatus)}</span>
            <div>
              <div className="text-sm font-semibold">
                GOP Margin: {(gopPctY3 * 100).toFixed(1)}%
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-xs opacity-70 hover:opacity-100 flex items-center space-x-1">
                      <Info className="h-3 w-3" />
                      <span>What's this?</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      GOP% is hotel profit before corporate costs and fixed charges. 
                      Typical range for boutique hotels: 20-55%.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            Typical range: 20-55%
          </Badge>
        </div>

        {/* Key metrics summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{Math.round(occY3)}%</div>
            <div className="text-xs text-slate-600">Year 3 Occupancy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">€{Math.round(adrY3)}</div>
            <div className="text-xs text-slate-600">Year 3 ADR</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">€{Math.round(revparY3)}</div>
            <div className="text-xs text-slate-600">Year 3 RevPAR</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{(fnbMarginY3 * 100).toFixed(0)}%</div>
            <div className="text-xs text-slate-600">F&B Margin</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}