import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RTooltip,
  ReferenceLine 
} from 'recharts';
import { formatScaledCurrency, Scale } from '../../lib/pl/format';
import { formatIRR } from '../../lib/finance/irr';
import { calculateIRR } from '../../lib/finance/irr';

interface WaterfallProps {
  totalInvestment: number;
  annualUnleveredCF: number[];
  netSaleProceeds: number;
  exitYear: number;
  currency: string;
  scale: Scale;
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: any }>;
  label?: string;
};

export default function CapexCashflowExitWaterfall({
  totalInvestment,
  annualUnleveredCF,
  netSaleProceeds,
  exitYear,
  currency,
  scale
}: WaterfallProps) {
  // Build waterfall data
  const waterfallData = React.useMemo(() => {
    const data = [];
    let runningTotal = 0;
    
    // Initial investment (negative)
    const initialOutflow = -Math.abs(totalInvestment);
    data.push({
      name: 'Investment',
      value: initialOutflow,
      cumulative: initialOutflow,
      type: 'investment'
    });
    runningTotal = initialOutflow;
    
    // Annual cash flows
    for (let year = 1; year <= exitYear; year++) {
      const cf = annualUnleveredCF[year - 1] || 0;
      runningTotal += cf;
      
      data.push({
        name: `Y${year} CF`,
        value: cf,
        cumulative: runningTotal,
        type: cf >= 0 ? 'positive' : 'negative'
      });
    }
    
    // Exit proceeds
    if (netSaleProceeds > 0) {
      runningTotal += netSaleProceeds;
      data.push({
        name: 'Exit Proceeds',
        value: netSaleProceeds,
        cumulative: runningTotal,
        type: 'exit'
      });
    }
    
    return data;
  }, [totalInvestment, annualUnleveredCF, netSaleProceeds, exitYear]);

  // Calculate KPIs
  const equityMultiple = React.useMemo(() => {
    const totalInflows = annualUnleveredCF.slice(0, exitYear).reduce((sum, cf) => sum + Math.max(0, cf), 0) + netSaleProceeds;
    const totalOutflows = Math.abs(totalInvestment);
    return totalOutflows > 0 ? totalInflows / totalOutflows : 0;
  }, [totalInvestment, annualUnleveredCF, netSaleProceeds, exitYear]);

  const unleveredIRR = React.useMemo(() => {
    const cashFlows = [-Math.abs(totalInvestment), ...annualUnleveredCF.slice(0, exitYear)];
    if (netSaleProceeds > 0 && exitYear > 0) {
      cashFlows[exitYear] = (cashFlows[exitYear] || 0) + netSaleProceeds;
    }
    return calculateIRR(cashFlows);
  }, [totalInvestment, annualUnleveredCF, netSaleProceeds, exitYear]);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload;
    if (!data) return null;
    
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-sm">
          Value: {formatScaledCurrency(data.value, currency, scale)}
        </p>
        <p className="text-sm">
          Cumulative: {formatScaledCurrency(data.cumulative, currency, scale)}
        </p>
      </div>
    );
  };

  const getBarColor = (type: string) => {
    switch (type) {
      case 'investment': return '#ef4444'; // red
      case 'positive': return '#10b981'; // green
      case 'negative': return '#f59e0b'; // amber
      case 'exit': return '#3b82f6'; // blue
      default: return '#64748b'; // slate
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Investment Waterfall</h3>
          <p className="text-sm text-slate-600">CapEx → Annual Cash Flows → Exit Proceeds</p>
        </div>
        
        {/* KPI Chips */}
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
            EM: {equityMultiple.toFixed(1)}x
          </div>
          <div className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
            IRR: {formatIRR(unleveredIRR)}
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }} 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatScaledCurrency(value, currency, scale)}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
            <RTooltip content={<CustomTooltip />} />
            
            {/* Waterfall bars */}
            <Bar 
              dataKey="value" 
              fill={(entry) => getBarColor(entry.type)}
              name="Cash Flow"
            />
            
            {/* Cumulative line */}
            <Line 
              type="monotone" 
              dataKey="cumulative" 
              stroke="#14b8a6" 
              strokeWidth={3}
              dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
              name="Cumulative"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}