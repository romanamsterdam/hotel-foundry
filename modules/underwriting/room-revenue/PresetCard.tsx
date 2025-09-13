import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

type PresetCardProps = {
  id: "beach" | "winterResort" | "majorCity" | "businessCity";
  title: string;
  subtitle: string;
  months: number[];
  active: boolean;
  onSelect: () => void;
};

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-8 justify-center">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded bg-sky-400/70 transition-colors duration-200"
          style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function PresetCard({ id, title, subtitle, months, active, onSelect }: PresetCardProps) {
  return (
    <button
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "relative rounded-xl border p-4 bg-white/70 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left w-full",
        active 
          ? "border-brand-500 bg-gradient-to-br from-brand-50/80 to-accent-50/80 shadow-lg ring-2 ring-brand-200" 
          : "border-slate-200 hover:border-brand-300"
      )}
      title={`Apply ${title} curve`}
    >
      {active && (
        <div className="absolute top-3 right-3">
          <div className="rounded-full bg-brand-500 p-1">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        
        <div className="space-y-2">
          <MiniBars values={months} />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Jan</span>
            <span>Dec</span>
          </div>
        </div>
      </div>
    </button>
  );
}