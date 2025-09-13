import { Button } from "./ui/button";

export default function DealWelcome({onStart}:{onStart:()=>void}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-xl font-semibold text-slate-900">Welcome to your first hotel deal</h2>
      <p className="mt-2 text-slate-600">
        Imagine you and a friend—both from sales—are taking on a 28-room villa. We'll guide you step-by-step:
        set up the deal, model revenues, add costs, then review if the investment stacks up.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
        <li><strong>Deal Setup:</strong> basics + investment budget</li>
        <li><strong>Revenue Modeling:</strong> rooms (ADR weights), F&amp;B, other income</li>
        <li><strong>Cost Structure:</strong> operating costs + payroll model</li>
      </ul>
      <Button className="mt-6 bg-brand-600 text-white hover:bg-brand-700" onClick={onStart}>
        Start Underwriting
      </Button>
    </div>
  );
}