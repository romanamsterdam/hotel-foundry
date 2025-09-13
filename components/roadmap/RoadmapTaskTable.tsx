import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../ui/toast";
import { cn } from "../../lib/utils";
import { defaultRoadmap } from "../../data/roadmapSteps";

type Status = "Not started" | "In progress" | "Done" | "Stuck";

type TaskRow = {
  id: string;
  chapterId: string;
  title: string;
  status: Status;
  due?: string;   // "YYYY-MM-DD"
  owner?: string;
  comment?: string;
};

type Props = {
  projectKey: string;
  rows: TaskRow[];
  onChange: (rows: TaskRow[]) => void;
  onSave?: (rows: TaskRow[]) => Promise<void>;
  searchable?: boolean;
  activeChapterId?: string;
};

export default function RoadmapTaskTable({ 
  projectKey, 
  rows, 
  onChange, 
  onSave, 
  searchable = true,
  activeChapterId 
}: Props) {
  const { toast } = useToast();
  const [local, setLocal] = useState<TaskRow[]>(rows ?? []);
  const [query, setQuery] = useState("");
  const [isDirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const chapterName = useMemo(
    () => defaultRoadmap.find(p => p.id === activeChapterId)?.phase ?? "All Chapters",
    [activeChapterId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = local;
    
    // Filter by active chapter
    if (activeChapterId) {
      result = result.filter(r => r.chapterId === activeChapterId);
    }
    
    // Filter by search query
    if (q) {
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.owner ?? "").toLowerCase().includes(q) ||
        (r.comment ?? "").toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [local, query, activeChapterId]);

  useEffect(() => {
    setLocal(rows ?? []);
    setDirty(false);
  }, [rows]);

  // Keyboard shortcut: Ctrl/Cmd + S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        void doSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [local, isDirty, saving]);

  function updateRow(id: string, patch: Partial<TaskRow>) {
    setLocal(prev => {
      const next = prev.map(r => (r.id === id ? { ...r, ...patch } : r));
      setDirty(true);
      onChange?.(next);
      return next;
    });
  }

  async function doSave() {
    if (!isDirty || saving) return;
    try {
      setSaving(true);
      await onSave?.(local);
      setDirty(false);
      toast.success("Changes saved successfully");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Chapter:</span>
          <span className="text-sm font-medium text-slate-900">
            {chapterName.replace(/^\d+\.\s*/, "")}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {searchable && (
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task, owner, comment"
              className="h-9 w-64 text-sm"
            />
          )}
          <Button
            onClick={doSave}
            disabled={!isDirty || saving}
            size="sm"
            className={cn(
              "h-9 px-3 flex items-center gap-2",
              isDirty ? "bg-brand-600 hover:bg-brand-700 text-white" : "bg-green-600 text-white"
            )}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[minmax(260px,1.5fr)_180px_160px_180px_minmax(260px,1.6fr)] items-center gap-3 border-b border-slate-200 px-4 py-2 text-[11px] uppercase tracking-wide text-slate-500 font-medium bg-slate-50">
        <div>Task</div>
        <div>Status</div>
        <div>Due Date</div>
        <div>Owner</div>
        <div>Comment</div>
      </div>

      {/* Task Rows */}
      <div>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            {query ? "No tasks match your search." : "No tasks in this chapter yet."}
          </div>
        ) : (
          filtered.map((r, idx) => (
            <div
              key={r.id}
              className={cn(
                "grid grid-cols-[minmax(260px,1.5fr)_180px_160px_180px_minmax(260px,1.6fr)] items-center gap-3 px-4 py-3",
                idx % 2 === 1 ? "bg-slate-50/50" : "bg-white",
                "border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
              )}
            >
              {/* Task Title */}
              <div className="text-sm font-medium text-slate-900 leading-snug pr-2">
                {r.title}
              </div>

              {/* Status */}
              <div>
                <Select
                  value={r.status}
                  onValueChange={(v: Status) => updateRow(r.id, { status: v })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not started">Not started</SelectItem>
                    <SelectItem value="In progress">In progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Stuck">Stuck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="relative">
                <Input
                  type="date"
                  value={r.due ?? ""}
                  onChange={(e) => updateRow(r.id, { due: e.target.value })}
                  className="h-9 text-sm pr-9"
                  placeholder="yyyy-mm-dd"
                />
                <CalendarDays className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              </div>

              {/* Owner */}
              <div>
                <Input
                  value={r.owner ?? ""}
                  onChange={(e) => updateRow(r.id, { owner: e.target.value })}
                  placeholder="Owner"
                  className="h-9 text-sm"
                />
              </div>

              {/* Comment */}
              <div>
                <Textarea
                  value={r.comment ?? ""}
                  onChange={(e) => updateRow(r.id, { comment: e.target.value })}
                  placeholder="Add a note"
                  className="min-h-9 h-9 text-sm resize-y"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 text-xs text-slate-500 bg-slate-50 rounded-b-2xl">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-400" /> Not started
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> In progress
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Done
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Stuck
        </span>
      </div>
    </div>
  );
}