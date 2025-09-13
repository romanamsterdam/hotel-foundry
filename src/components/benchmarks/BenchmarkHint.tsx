import { useBenchmarks } from "../../lib/benchmarks/useBenchmarks";
import type { Level } from "../../lib/types/benchmarks";

export function SalaryBenchmarkHint({ countryCode, role }: { countryCode: string; role: string }) {
  const bm = useBenchmarks(countryCode);
  const low = bm.getSalary(role, "low");
  const mkt = bm.getSalary(role, "market");
  const hi  = bm.getSalary(role, "high");
  
  if (low == null || mkt == null || hi == null) return null;

  return (
    <div className="space-y-1 text-xs">
      <div className="font-medium">Salary benchmark ({countryCode})</div>
      <div>Low: €{low.toLocaleString()}</div>
      <div>Market: €{mkt.toLocaleString()}</div>
      <div>High: €{hi.toLocaleString()}</div>
    </div>
  );
}

export function UsaliBenchmarkHint({ countryCode, category }: { countryCode: string; category: string }) {
  const bm = useBenchmarks(countryCode);
  const low = bm.getUsali(category, "low");
  const mkt = bm.getUsali(category, "market");
  const hi  = bm.getUsali(category, "high");
  
  if (low == null || mkt == null || hi == null) return null;

  return (
    <div className="space-y-1 text-xs">
      <div className="font-medium">USALI benchmark ({countryCode})</div>
      <div>Low: {low}% of revenue</div>
      <div>Market: {mkt}% of revenue</div>
      <div>High: {hi}% of revenue</div>
    </div>
  );
}

export function CapexBenchmarkHint({ countryCode, item }: { countryCode: string; item: string }) {
  const bm = useBenchmarks(countryCode);
  const result = bm.getCapex(item, "market");
  
  if (!result) return null;

  const low = bm.getCapex(item, "low");
  const mkt = bm.getCapex(item, "market");
  const hi = bm.getCapex(item, "high");
  
  if (!low || !mkt || !hi) return null;

  const unit = result.basis === "per_key" ? "per room" : "per sqm";

  return (
    <div className="space-y-1 text-xs">
      <div className="font-medium">CapEx benchmark ({countryCode})</div>
      <div>Low: €{low.value.toLocaleString()} {unit}</div>
      <div>Market: €{mkt.value.toLocaleString()} {unit}</div>
      <div>High: €{hi.value.toLocaleString()} {unit}</div>
    </div>
  );
}