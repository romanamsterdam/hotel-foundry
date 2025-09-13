import React from "react";

export type RoadmapStatus = "Not started" | "In progress" | "Done" | "Stuck";

export function StatusBadge({ status }: { status: RoadmapStatus | string }) {
  const map: Record<string, string> = {
    "Not started": "bg-gray-100 text-gray-800",
    "In progress": "bg-blue-100 text-blue-800",
    "Done": "bg-emerald-100 text-emerald-800",
    "Stuck": "bg-rose-100 text-rose-800",
    // Legacy compatibility
    "Todo": "bg-gray-100 text-gray-800",
    "Review": "bg-amber-100 text-amber-800",
    "Blocked": "bg-rose-100 text-rose-800",
  };
  const cls = map[status] || "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{status}</span>;
}

export function OwnerPill({ name }: { name?: string }) {
  if (!name) return <span className="text-sm text-slate-400">—</span>;
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
        {initials}
      </span>
      <span className="text-sm text-slate-800">{name}</span>
    </span>
  );
}