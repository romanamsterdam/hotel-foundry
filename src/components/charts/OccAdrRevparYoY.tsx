import React, { useState } from 'react';
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Toggle } from '../ui/toggle';
import { formatCurrency } from '../../lib/utils';

type CustomTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number; dataKey: string; name: string; color: string }>;
  viewMode?: 'yoy' | 'absolute';
  currency?: string;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, viewMode, currency }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-slate-900">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {
            viewMode === 'yoy' 
              ? `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(1)}%`
              : entry.dataKey === 'occupancy'
                ? `${entry.value.toFixed(1)}%`
                : formatCurrency(entry.value, currency)
          }
        </p>
      ))}
    </div>
  );
};

interface YoYChartProps {
  occupancyByYear: number[];
  adrByYear: number[];
  revparByYear: number[];
  exitYear: number;
  currency: string;
}

export default function OccAdrRevparYoY({
  occupancyByYear,
  adrByYear,
  revparByYear,
  exitYear,
  currency
}: YoYChartProps) {
  const [viewMode, setViewMode] = useState<'yoy' | 'absolute'>('yoy');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Build chart data
  const chartData = React.useMemo(() => {
    const data = [];
    
    for (let year = 2; year <= exitYear; year++) {
      const idx = year - 1;
      const prevIdx = year - 2;
      
      if (viewMode === 'yoy') {
        // YoY percentage changes
        const yoyOcc = occupancyByYear[prevIdx] > 0 
          ? ((occupancyByYear[idx] - occupancyByYear[prevIdx]) / occupancyByYear[prevIdx]) * 100
          : 0;
        const yoyADR = adrByYear[prevIdx] > 0 
          ? ((adrByYear[idx] - adrByYear[prevIdx]) / adrByYear[prevIdx]) * 100
          : 0;
        const yoyRevPAR = revparByYear[prevIdx] > 0 
          ? ((revparByYear[idx] - revparByYear[prevIdx]) / revparByYear[prevIdx]) * 100
          : 0;
        
        data.push({
          year: `Year ${year}`,
          occupancy: yoyOcc,
          adr: yoyADR,
          revpar: yoyRevPAR
        });
      } else {
        // Absolute values
        data.push({
          year: `Year ${year}`,
          occupancy: occupancyByYear[idx],
          adr: adrByYear[idx],
          revpar: revparByYear[idx]
        });
      }
    }
    
    return data;
  }, [occupancyByYear, adrByYear, revparByYear, exitYear, viewMode]);

  const handleMouseMove = (state: any) => {
    const idx = state?.activeTooltipIndex;
    if (typeof idx === "number") setActiveIndex(idx);
  };

  const handleMouseLeave = () => setActiveIndex(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {viewMode === 'yoy' ? 'Year-over-Year Growth' : 'Absolute Performance'}
          </h3>
          <p className="text-sm text-slate-600">
            {viewMode === 'yoy' 
              ? 'Annual percentage changes in key revenue metrics'
              : 'Absolute values for occupancy, ADR, and RevPAR'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-slate-600">View:</span>
          <Toggle
            pressed={viewMode === 'yoy'}
            onPressedChange={(pressed) => setViewMode(pressed ? 'yoy' : 'absolute')}
            className="data-[state=on]:bg-brand-600 data-[state=on]:text-white"
          >
            {viewMode === 'yoy' ? 'YoY %' : 'Absolute'}
          </Toggle>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (viewMode === 'yoy') {
                  return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;
                } else {
                  return value.toFixed(0);
                }
              }}
              domain={viewMode === 'yoy' ? ["auto", "auto"] : ["auto", "auto"]}
            />
            {viewMode === 'yoy' && <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />}
            <RTooltip content={<CustomTooltip />} />
            <Legend />
            <RTooltip content={<CustomTooltip viewMode={viewMode} currency={currency} />} />
            <Line 
              type="monotone" 
              dataKey="occupancy" 
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              name={viewMode === 'yoy' ? 'Occupancy YoY %' : 'Occupancy %'}
            />
            <Line 
              type="monotone" 
              dataKey="adr" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name={viewMode === 'yoy' ? 'ADR YoY %' : `ADR (${currency})`}
            />
            <Line 
              type="monotone" 
              dataKey="revpar" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name={viewMode === 'yoy' ? 'RevPAR YoY %' : `RevPAR (${currency})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}