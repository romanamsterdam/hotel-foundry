import { useEffect, useState, useCallback } from "react";
import { initDataSource } from "../../lib/datasource";
import { listConsulting, updateConsulting } from "../../lib/consultingApi";
import type { ConsultingRequest, ConsultingStatus } from "../../lib/datasource";

export function useConsultingData() {
  const [rows, setRows] = useState<ConsultingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await initDataSource();
      const data = await listConsulting();
      if (alive) setRows(data);
      setLoading(false);
    })().catch((e) => { console.error(e); setLoading(false); });
    return () => { alive = false; };
  }, []);

  const patch = useCallback(async (id: string, p: Partial<ConsultingRequest>) => {
    const saved = await updateConsulting(id, p);
    setRows(prev => prev.map(r => r.id === id ? saved : r));
  }, []);

  const setStatus = useCallback((id: string, status: ConsultingStatus) => {
    return patch(id, { status });
  }, [patch]);

  const setAssignee = useCallback((id: string, assignee: string) => {
    return patch(id, { assignee });
  }, [patch]);

  const setNotes = useCallback((id: string, notes: string) => {
    return patch(id, { notes });
  }, [patch]);

  // Toggle unread ↔ in_progress (sensible default)
  const toggleUnread = useCallback((id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    const next = row.status === "unread" ? "in_progress" : "unread";
    return setStatus(id, next);
  }, [rows, setStatus]);

  return { rows, loading, setStatus, setAssignee, setNotes, toggleUnread };
}