import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { totalRooms } from '../../lib/rooms';
import { Deal } from '../../types/deal';

interface DealSnapshotProps {
  deal: Deal;
  revparByYear: number[];
  ebitdaByYear: number[];
  leveredCFByYear: number[];
  exitYear: number;
  netSaleProceeds: number;
}

export default function DealSnapshot({ 
  deal, 
  revparByYear, 
  ebitdaByYear, 
  leveredCFByYear, 
  exitYear,
  netSaleProceeds
}: DealSnapshotProps) {
  const rooms = totalRooms(deal.roomTypes);
  const projectCost = deal.budget?.grandTotal || 0;
  const financingSettings = deal.assumptions?.financingSettings;
  const exitSettings = deal.assumptions?.exitSettings;

  // Build chart data
  const revparData = revparByYear.slice(0, exitYear).map((value, index) => ({
    year: index + 1,
    value: Math.round(value)
  }));

  const ebitdaData = ebitdaByYear.slice(0, exitYear).map((value, index) => ({
    year: index + 1,
    value: Math.round(value / 1000) // Show in thousands
  }));

  const cashflowData = leveredCFByYear.slice(0, exitYear + 1).map((value, index) => ({
    year: index,
    value: Math.round(value / 1000) // Show in thousands
  }));

  const CustomTooltip = ({ active, payload, label, dataKey }: any) => {
    if (!active || !payload?.length) return null;
    
    const value = payload[0].value;
    let formattedValue = '';
    let description = '';
    
    if (dataKey === 'revpar') {
      formattedValue = formatCurrency(value, deal.currency);
      description = 'Revenue per available room';
    } else if (dataKey === 'ebitda') {
      formattedValue = `€${value}k`;
      description = 'Earnings before interest, taxes, depreciation';
    } else {
      formattedValue = `€${value}k`;
      description = 'Cash flow to equity investors';
    }
    
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-slate-900">Year {label}</p>
        <p className="text-sm">{description}: {formattedValue}</p>
      </div>
    );
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Deal Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Facts Column */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Rooms:</span>
                <span className="font-medium text-slate-900">{rooms}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Investment:</span>
                <span className="font-medium text-slate-900">{formatCurrency(projectCost, deal.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Net Sale Proceeds:</span>
                <span className="font-medium text-slate-900">{formatCurrency(netSaleProceeds, deal.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Exit Year:</span>
                <span className="font-medium text-slate-900">Year {exitYear}</span>
              </div>
              {exitSettings?.strategy === 'SALE' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Exit Cap Rate:</span>
                  <span className="font-medium text-slate-900">{exitSettings.sale.exitCapRate}%</span>
                </div>
              )}
              {financingSettings && financingSettings.ltcPct > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">LTV:</span>
                    <span className="font-medium text-slate-900">{financingSettings.ltcPct}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Interest Rate:</span>
                    <span className="font-medium text-slate-900">{financingSettings.interestRatePct}%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Charts Column */}
          <div className="space-y-4">
            {/* RevPAR Sparkline */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">RevPAR Trend</h4>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revparData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#14b8a6" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} dataKey="revpar" />} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* EBITDA Sparkline */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">EBITDA Trend (€k)</h4>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ebitdaData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} dataKey="ebitda" />} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash Flow Sparkline */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Levered Cash Flow (€k)</h4>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashflowData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} dataKey="cashflow" />} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}