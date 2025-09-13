import React, { useMemo } from "react";
import type { ConsultingRequest, ConsultingStatus } from "../../lib/datasource";
import { useConsultingData } from "../../features/consulting/useConsultingData";
// Optional store; if not available, fallbacks below keep things working
// (If your project doesn't have this store, keep the import; the typeof check prevents runtime issues.)
import { useConsultingStore } from "../../lib/consulting/store";
// If you have custom UI atoms, keep this import; otherwise you can comment it out and use plain text:
import { StatusBadge, statusLabel } from "../../lib/consulting/ui";

const STATUS_OPTIONS: ConsultingStatus[] = [
  "unread",
  "proposal_submitted",
  "declined",
  "in_progress",
  "completed",
];

export default function ConsultingRequestsPage() {
  // Data-layer hook (single source of truth). Aliased handlers to avoid name clashes.
  const {
    rows,
    loading,
    setStatus: setStatusApi,
    setAssignee: setAssigneeApi,
    setNotes: setNotesApi,
    toggleUnread: toggleUnreadApi,
  } = useConsultingData();

  // Store is optional: we only take filters/search if available
  const store = typeof useConsultingStore === "function" ? useConsultingStore() : null;
  const q = store?.q ?? "";
  const setQuery = store?.setQuery ?? (() => {});
  const statusFilter = store?.statusFilter ?? "all"; // "all" | ConsultingStatus
  const setStatusFilter = store?.setStatusFilter ?? (() => {});
  const unreadOnly = store?.unreadOnly ?? false;
  const setUnreadOnly = store?.setUnreadOnly ?? (() => {});

  // Derived list with simple filters
  const items: ConsultingRequest[] = useMemo(() => {
    let list = rows;
    if (q) {
      const n = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.message?.toLowerCase().includes(n) ||
          r.notes?.toLowerCase().includes(n) ||
          r.assignee?.toLowerCase().includes(n)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === (statusFilter as ConsultingStatus));
    }
    if (unreadOnly) {
      list = list.filter((r) => r.status === "unread");
    }
    return list;
  }, [rows, q, statusFilter, unreadOnly]);

  // Inline handlers (avoid re-declaring conflicting names)
  const onStatusChange = (id: string, value: string) =>
    setStatusApi(id, value as ConsultingStatus);

  const onAssigneeBlur = (id: string, value: string) =>
    setAssigneeApi(id, value.trim());

  const onNotesBlur = (id: string, value: string) =>
    setNotesApi(id, value);

  const onToggleUnread = (id: string) => toggleUnreadApi(id);

  return (
    <main className="p-4 space-y-4">
      {/* Top controls (search & filters) — only active if store exists */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded px-3 py-2"
          placeholder="Search requests…"
          value={q}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2 w-[40%]">Message</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Assignee</th>
                <th className="py-2 pr-2 w-[40%]">Notes</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium">{r.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at ?? Date.now()).toLocaleString()}
                    </div>
                  </td>

                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      <select
                        className="border rounded px-2 py-1"
                        defaultValue={r.status}
                        onChange={(e) => onStatusChange(r.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                      {/* Optional badge if your UI lib exists */}
                      {typeof StatusBadge === "function" ? (
                        <StatusBadge status={r.status} />
                      ) : (
                        <span className="text-xs uppercase opacity-70">
                          {typeof statusLabel === "function"
                            ? statusLabel(r.status)
                            : r.status}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 pr-2">
                    <input
                      className="border rounded px-2 py-1 w-36"
                      placeholder="Assignee"
                      defaultValue={r.assignee ?? ""}
                      onBlur={(e) => onAssigneeBlur(r.id, e.target.value)}
                    />
                  </td>

                  <td className="py-2 pr-2">
                    <input
                      className="border rounded px-2 py-1 w-full"
                      placeholder="Notes"
                      defaultValue={r.notes ?? ""}
                      onBlur={(e) => onNotesBlur(r.id, e.target.value)}
                    />
                  </td>

                  <td className="py-2 pr-2">
                    <button
                      className="border rounded px-2 py-1"
                      onClick={() => onToggleUnread(r.id)}
                      title={
                        r.status === "unread" ? "Mark read" : "Mark unread"
                      }
                    >
                      {r.status === "unread" ? "Mark read" : "Mark unread"}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No consulting requests match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}