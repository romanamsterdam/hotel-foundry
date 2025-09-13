import React from "react";
import { defaultRoadmap } from "../../data/roadmapSteps";
import { useUserRoadmapTasks } from "../../stores/userRoadmapTasks";
import { cn } from "../../lib/utils";

export default function RoadmapSidebar() {
  const active = useUserRoadmapTasks(s => s.activeChapterId);
  const setActive = useUserRoadmapTasks(s => s.setActiveChapter);

  return (
    <aside className="lg:col-span-3">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Chapters</h2>
        </div>
        <nav className="p-2">
          {defaultRoadmap.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActive(phase.id)}
              className={cn(
                "w-full text-left px-4 py-2 rounded-xl my-1 hover:bg-slate-100",
                active === phase.id ? "bg-slate-900 text-white hover:bg-slate-900" : "text-slate-800"
              )}
            >
              {phase.phase.replace(/^\d+\.\s*/, "")}
            </button>
          ))}
        </nav>
        <div className="px-4 pb-4 text-xs text-slate-500">
          Filter by chapter here; refine on the right by search.
        </div>
      </div>
    </aside>
  );
}