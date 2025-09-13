import { underwritingSteps } from "../data/underwritingSteps";
import { loadProgress } from "../lib/uwProgress";
import { Check } from "lucide-react";

type Props = {
  dealId: string;
  activeId: string;
  onSelect: (id: string) => void;
};

export default function UnderwriteSidebar({ dealId, activeId, onSelect }: Props) {
  const prog = loadProgress(dealId);
  const groups = [
    { title: "Deal Setup", ids: ["propertyDetails","investmentBudget"] },
    { title: "Revenue Modeling", ids: ["roomRevenue","fbRevenue","otherRevenue"] },
    { title: "Cost Structure", ids: ["operatingCosts","payrollModel","rampSettings"] },
    { title: "Financing & Exit", ids: ["financingStructure","exitStrategy"] },
    { title: "Analysis & Reporting", ids: ["pl-statement","cash-flow-statement","charts-kpis","staffing-sense-check"] },
    { title: "Final Step", ids: ["underwriting-summary"] },
  ];

  return (
    <aside className="sticky top-20 h-fit w-full space-y-6">
      {groups.map(g => (
        <div key={g.title}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</div>
          <nav className="space-y-2">
            {g.ids.map(id => {
              const s = underwritingSteps.find(x => x.id === id) || 
                       (id === "pl-statement" ? { id, title: "P&L Statement", group: "Analysis & Reporting" } : null) ||
                       (id === "cash-flow-statement" ? { id, title: "Cash Flow Statement", group: "Analysis & Reporting" } : null) ||
                       (id === "charts-kpis" ? { id, title: "Charts & Key KPIs", group: "Analysis & Reporting" } : null) ||
                       (id === "staffing-sense-check" ? { id, title: "Staffing Sense Check", group: "Analysis & Reporting" } : null) ||
                       (id === "underwriting-summary" ? { id, title: "Underwriting Summary", group: "Final Step" } : null);
              
              if (!s) return null;
              
              const done = !!prog[id]?.completed;
              const active = activeId === id;
              return (
                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition
                    ${active ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <span className="truncate">{s.title}</span>
                  {done && <Check className="ml-2 h-4 w-4 text-emerald-600" />}
                </button>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}