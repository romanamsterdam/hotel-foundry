import { useState } from 'react';
import { Info } from 'lucide-react';

type BenchmarkMeterProps = {
  label: string;
  currentValue: number;
  target: number;
  min?: number;
  max?: number;
  unit: "%" | "€";
};

export default function BenchmarkMeter({ 
  label, 
  currentValue, 
  target, 
  min, 
  max, 
  unit 
}: BenchmarkMeterProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // For percentage benchmarks, show a visual meter
  if (unit === "%" && min !== undefined && max !== undefined) {
    const range = max - min;
    const targetPosition = range > 0 ? ((target - min) / range) * 100 : 50;
    const currentPosition = range > 0 ? Math.min(Math.max(((currentValue - min) / range) * 100, 0), 100) : 50;
    
    // Determine color based on how close current is to target
    const distance = Math.abs(currentValue - target);
    const tolerance = range * 0.1; // 10% of range
    
    let indicatorColor = 'bg-green-500'; // Good
    if (distance > tolerance) indicatorColor = 'bg-yellow-500'; // Caution
    if (distance > tolerance * 2) indicatorColor = 'bg-red-500'; // Warning
    
    return (
      <div className="relative">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="w-16 h-2 bg-slate-200 rounded-full relative">
            {/* Target range band */}
            <div 
              className="absolute h-2 bg-slate-300 rounded-full"
              style={{ 
                left: `${Math.max(0, targetPosition - 10)}%`, 
                width: '20%' 
              }}
            />
            {/* Current value indicator */}
            <div 
              className={`absolute w-1 h-2 ${indicatorColor} rounded-full`}
              style={{ left: `${currentPosition}%` }}
            />
          </div>
          <Info className="h-3 w-3 text-slate-400" />
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 text-white text-xs rounded-lg p-3 z-50 shadow-lg">
            <div className="font-semibold mb-2">{label} Benchmark</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Current:</span>
                <span>{currentValue}{unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Target:</span>
                <span>{target}{unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Range:</span>
                <span>{min}–{max}{unit}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // For fixed euro amounts, just show the target
  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-2 cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-xs text-slate-600 font-medium">
          Target: {unit === "€" ? "€" : ""}{target}{unit === "%" ? "%" : ""}
        </span>
        <Info className="h-3 w-3 text-slate-400" />
      </div>

      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-40 bg-slate-900 text-white text-xs rounded-lg p-3 z-50 shadow-lg">
          <div className="font-semibold mb-1">{label} Target</div>
          <div>{unit === "€" ? "€" : ""}{target}{unit === "%" ? "%" : ""}</div>
        </div>
      )}
    </div>
  );
}