export default function KpiCard({label,value,sub,tip}:{label:string;value:string;sub?:string;tip?:string}) {
  return (
    <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-navy-600">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold text-navy-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-navy-500">{sub}</div>}
      {tip && <div className="mt-3 rounded-md bg-navy-50/50 p-2 text-xs text-navy-600">{tip}</div>}
    </div>
  );
}