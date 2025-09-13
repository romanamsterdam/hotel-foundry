import { RoadmapStep } from "./types";

/**
 * Compute critical path using longest path in DAG (topological).
 * Steps without dates use durationDays or default 1.
 */
export function computeCriticalPath(steps: RoadmapStep[]): { criticalIds: Set<string>, topo: string[] } {
  const byId = new Map(steps.map(s => [s.id, s]));
  const graph = new Map<string, string[]>();
  const indeg = new Map<string, number>();

  steps.forEach(s => { graph.set(s.id, []); indeg.set(s.id, 0); });
  steps.forEach(s => {
    s.dependsOnIds.forEach(d => {
      if (!graph.has(d)) graph.set(d, []);
      graph.get(d)!.push(s.id);
      indeg.set(s.id, (indeg.get(s.id) || 0) + 1);
    });
  });

  // Kahn topo
  const q: string[] = [];
  indeg.forEach((v, id) => { if (v === 0) q.push(id); });
  const topo: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    topo.push(id);
    (graph.get(id) || []).forEach(n => {
      indeg.set(n, (indeg.get(n) || 0) - 1);
      if (indeg.get(n) === 0) q.push(n);
    });
  }

  // Longest distance DP
  const dur = (s: RoadmapStep) => s.durationDays ?? (s.startDate && s.dueDate ? Math.max(1, Math.ceil((+new Date(s.dueDate) - +new Date(s.startDate)) / (1000*3600*24))) : 1);
  const dist = new Map<string, number>();
  const pred = new Map<string, string | null>();
  steps.forEach(s => { dist.set(s.id, 0); pred.set(s.id, null); });
  topo.forEach(id => {
    const s = byId.get(id)!;
    const base = Math.max(0, ...s.dependsOnIds.map(d => dist.get(d) || 0));
    const val = base + dur(s);
    dist.set(id, val);
    // pick the predecessor contributing the max
    let p: string | null = null;
    let best = -1;
    s.dependsOnIds.forEach(d => { const dv = dist.get(d) || 0; if (dv > best) { best = dv; p = d; }});
    pred.set(id, p);
  });

  // Find terminal with max dist and backtrack
  let endId = topo[0] || "";
  topo.forEach(id => { if ((dist.get(id) || 0) > (dist.get(endId) || 0)) endId = id; });
  const criticalIds = new Set<string>();
  let cur: string | null = endId;
  while (cur) { criticalIds.add(cur); cur = pred.get(cur) ?? null; }

  return { criticalIds, topo };
}

export function detectCycles(steps: RoadmapStep[]): string[] {
  const graph = new Map<string, string[]>();
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[] = [];

  steps.forEach(s => graph.set(s.id, s.dependsOnIds));

  function dfs(nodeId: string): boolean {
    if (recStack.has(nodeId)) {
      cycles.push(nodeId);
      return true;
    }
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    recStack.delete(nodeId);
    return false;
  }

  steps.forEach(s => {
    if (!visited.has(s.id)) {
      dfs(s.id);
    }
  });

  return cycles;
}