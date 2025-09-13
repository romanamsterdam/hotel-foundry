import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip as RTooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Tooltip as RadixTooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../ui/tooltip';
import { Info } from 'lucide-react';

interface SensitivityMiniProps {
  baselineIRR: number;
  deltaPercent?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number; dataKey: string }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-slate-900">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color || '#64748b' }}>
          {entry.name}: {entry.value.toFixed(1)}pp
        </p>
      ))}
    </div>
  );
};

export default function SensitivityMini({ baselineIRR, deltaPercent = 10 }: SensitivityMiniProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Mock sensitivity data - in real implementation, this would come from actual calculations
  const sensitivityData = [
    {
      driver: 'ADR',
      impact: 0.08,
      tooltip: 'Average price per room night. Higher ADR → higher profits.'
    },
    {
      driver: 'Occupancy',
      impact: 0.06,
      tooltip: 'Share of rooms sold. Higher occupancy → more revenue.'
    },
    {
      driver: 'Exit Cap Rate',
      impact: 0.05,
      tooltip: 'The yield buyers require at sale. Higher cap rate → lower sale price.'
    },
    {
      driver: 'CapEx',
      impact: 0.04,
      tooltip: 'Total project investment cost. Higher CapEx → lower returns.'
    },
    {
      driver: 'Operating Costs',
      impact: 0.03,
      tooltip: 'Total operating expenses. Higher costs → lower profits.'
    }
  ].map(item => ({
    name: item.driver,
    downside: -(item.impact * (deltaPercent / 10)) * 100, // Convert to percentage points
    upside: (item.impact * (deltaPercent / 10)) * 100,
    tooltip: item.tooltip
  }));

  const handleMouseMove = (state: any) => {
    const idx = state?.activeTooltipIndex;
    if (typeof idx === "number") setActiveIndex(idx);
  };

  const handleMouseLeave = () => setActiveIndex(null);

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg">Sensitivity Analysis</CardTitle>
          <TooltipProvider>
            <RadixTooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Shows how much your IRR would move if key assumptions change by ±{deltaPercent}%. 
                  Longer bars = bigger impact on returns.
                </p>
              </TooltipContent>
            </RadixTooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sensitivityData}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}pp`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                width={80}
              />
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="2 2" />
              <RTooltip content={<CustomTooltip />} />
              <Bar dataKey="downside" fill="#ef4444" name="Downside" />
              <Bar dataKey="upside" fill="#10b981" name="Upside" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-3">
          <strong>Note:</strong> Sensitivity shows potential IRR impact from ±{deltaPercent}% assumption changes. 
          Results are estimates based on current model structure.
        </div>
      </CardContent>
    </Card>
  );
}