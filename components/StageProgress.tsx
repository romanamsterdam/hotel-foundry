import { underwritingSteps } from "../data/underwritingSteps";
import { loadProgress } from "../lib/uwProgress";

export default function StageProgress({dealId,onSelect}:{dealId:string; onSelect:(id:string)=>void}) {
  const prog = loadProgress(dealId);
  const groups = [
    { id:"setup",   name:"Deal Setup",       items:["propertyDetails","investmentBudget"] },
    { id:"rev",     name:"Revenue Modeling", items:["roomRevenue","fbRevenue","otherRevenue"] },
    { id:"costs",   name:"Cost Structure",   items:["operatingCosts","payrollModel"] }
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3 text-sm font-semibold text-slate-700">Your underwriting progress</div>
      <div className="space-y-4">
        {groups.map(g=>{
          const total = g.items.length;
          const done  = g.items.filter(id=>prog[id as keyof typeof prog]?.completed).length;
          const pct   = Math.round((done/total)*100);
          return (
            <div key={g.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <div className="font-medium text-slate-800">{g.name}</div>
                <div className="text-slate-500">{done}/{total} • {pct}%</div>
              </div>
              <div className="h-2 w-full rounded bg-slate-100">
                <div className="h-2 rounded bg-success-600" style={{width:`${pct}%`}}/>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.items.map(id=>{
                  const s = underwritingSteps.find(x=>x.id===id)!;
                  const completed = !!prog[id as keyof typeof prog]?.completed;
                  return (
                    <button
                      key={id}
                      onClick={()=>onSelect(id)}
                      className={`rounded-md border px-2 py-1 text-xs ${completed ? "border-success-600 text-success-600" : "border-slate-300 text-slate-600"} hover:bg-slate-50`}
                    >
                      {s.title}{completed ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}