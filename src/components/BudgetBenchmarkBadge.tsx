import { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type Unit = "per sqm" | "per room" | "% of total";

export type Benchmark = {
  low: number;
  mid: number;
  high: number;
  unit: Unit;
  source?: string;
};

type Props = {
  label: string;
  benchmark: Benchmark;
  currentValue: number;
};

export default function BudgetBenchmarkBadge({ label, benchmark, currentValue }: Props) {
  const [showPopover, setShowPopover] = useState(false);
  
  const { low, mid, high, unit, source } = benchmark;
  
  // Determine which range the current value falls into
  const getActiveRange = () => {
    if (currentValue <= low) return 'low';
    if (currentValue <= mid) return 'mid';
    return 'high';
  };
  
  const activeRange = getActiveRange();
  
  // Calculate position for the indicator dot (0-100%)
  const getPosition = () => {
    if (currentValue <= low) return 0;
    if (currentValue >= high) return 100;
    return ((currentValue - low) / (high - low)) * 100;
  };
  
  const position = getPosition();
  
  const formatValue = (value: number) => {
    if (unit === "% of total") return `${value}%`;
    if (unit === "per sqm" || unit === "per room") {
      return new Intl.NumberFormat('en-GB', { 
        style: 'currency', 
        currency: 'EUR', 
        maximumFractionDigits: 0 
      }).format(value);
    }
    return value.toString();
  };

  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-1 cursor-pointer"
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        onClick={() => setShowPopover(!showPopover)}
      >
        <div className="flex space-x-1">
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            activeRange === 'low' 
              ? "bg-green-100 text-green-700 ring-1 ring-green-300" 
              : "bg-slate-100 text-slate-600"
          )}>
            {formatValue(low)}
          </span>
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            activeRange === 'mid' 
              ? "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300" 
              : "bg-slate-100 text-slate-600"
          )}>
            {formatValue(mid)}
          </span>
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            activeRange === 'high' 
              ? "bg-red-100 text-red-700 ring-1 ring-red-300" 
              : "bg-slate-100 text-slate-600"
          )}>
            {formatValue(high)}
          </span>
        </div>
        <Info className="h-3 w-3 text-slate-400" />
      </div>

      {/* Popover */}
      {showPopover && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
          <h4 className="font-semibold text-slate-900 mb-3">{label} Benchmark</h4>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Low</span>
              <span className="font-medium text-slate-900">{formatValue(low)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Current</span>
              <span className="font-medium text-slate-900">{formatValue(currentValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">High</span>
              <span className="font-medium text-slate-900">{formatValue(high)}</span>
            </div>
          </div>

          {/* Position indicator bar */}
          <div className="mb-3">
            <div className="relative h-2 bg-slate-200 rounded-full">
              <div 
                className="absolute top-0 h-2 w-1 bg-brand-500 rounded-full transform -translate-x-0.5"
                style={{ left: `${Math.min(Math.max(position, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {source && (
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-2">
              Source: {source}
            </div>
          )}
        </div>
      )}
    </div>
  );
}