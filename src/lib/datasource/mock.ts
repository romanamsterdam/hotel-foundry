import type { DataSource, Project, RoadmapTask, ConsultingRequest, UUID } from "./types";
import type { ProjectInput } from "../../types/projects";

const LS_KEY = "hf-mock";
type Store = { projects: Project[]; tasks: RoadmapTask[]; consulting: ConsultingRequest[]; };

const load = (): Store | null => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || ""); } catch { return null; }
};

const init: Store = load() ?? {
  projects: [
    { id: "p-1", name: "Siargao Pilot", created_at: new Date().toISOString() },
    { id: "p-2", name: "Bali Surf Lodge", created_at: new Date().toISOString() },
  ],
  tasks: [
    { id: "t-1", project_id: "p-1", title: "Land LOI & DD", status: "in_progress", owner: "Roman", comment: "LOI in draft" },
    { id: "t-2", project_id: "p-1", title: "Concept brief v1", status: "not_started" },
    { id: "t-3", project_id: "p-2", title: "Zoning check", status: "done" },
  ],
  consulting: [
    { id: "c-1", message: "Underwrite 20-key eco resort", status: "unread", assignee: null },
    { id: "c-2", message: "Capex sanity check", status: "in_progress", assignee: "Anna" },
  ],
};

let store: Store = init;
const persist = () => localStorage.setItem(LS_KEY, JSON.stringify(store));
const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

// ---- helpers ----
const normalizeProjectInput = (input: string | ProjectInput) => {
  if (typeof input === "string") {
    return { property_id: null, name: input, stage: null, currency: null, kpis: null };
  }
  return {
    property_id: input.property_id ?? null,
    name: input.name,
    stage: input.stage ?? null,
    currency: input.currency ?? null,
    kpis: input.kpis ?? null,
  };
};

function buildProject(input: string | ProjectInput) {
  const p = normalizeProjectInput(input);
  return {
    id: genId("p"),
    created_at: new Date().toISOString(),
    owner_id: "mock-user",
    ...p,
  };
}

function buildConsultingRequest(input: any): ConsultingRequest {
  const req: ConsultingRequest = {
    id: genId("c"),
    user_id: input.user_id ?? null,
    message: input.message ?? "",
    notes: null,
    status: "unread",
    assignee: input.assignee ?? null,
    created_at: new Date().toISOString()
  };
  return req;
}

// ---- single source of truth: mockDs object (NO extra top-level exports) ----
export const mockDs: DataSource = {
  async listProjects() {
    return [...store.projects];
  },

  // unified signature: string | ProjectInput -> Project
  async createProject(input: string | ProjectInput) {
    const row = buildProject(input);
    store.projects.push(row);
    persist();
    return row as Project;
  },

  // Single entry point for Underwriting Save
  async saveProject(input: ProjectInput) {
    if (input.id) {
      // Update existing
      const i = store.projects.findIndex(p => p.id === input.id);
      if (i === -1) throw new Error("Project not found");
      const updated = { ...store.projects[i], ...normalizeProjectInput(input) };
      store.projects[i] = updated;
      persist();
      return updated as Project;
    }
    // Create new
    const row = buildProject(input);
    store.projects.push(row);
    persist();
    return row as Project;
  },

  async listTasks(projectId: UUID) {
    return store.tasks.filter(t => t.project_id === projectId);
  },

  async upsertTask(input: Partial<RoadmapTask> & { id?: UUID; project_id: UUID; title: string }) {
    let t = store.tasks.find(x => x.id === input.id);
    if (!t) {
      t = { id: genId("t"), project_id: input.project_id!, title: input.title, status: "not_started" } as RoadmapTask;
      store.tasks.push(t);
    }
    Object.assign(t, input);
    persist();
    return t!;
  },

  async listConsulting() {
    return [...store.consulting];
  },

  async updateConsulting(id: UUID, patch: Partial<ConsultingRequest>) {
    const c = store.consulting.find(x => x.id === id);
    if (!c) throw new Error("Not found");
    Object.assign(c, patch);
    persist();
    return c;
  },
};

// Export consulting helper for backward compatibility
export async function createConsultingRequest(
  input: any
): Promise<{ data: ConsultingRequest | null; error?: string | null }> {
  try {
    const row = buildConsultingRequest(input);
    store.consulting.push(row);
    persist();
    return { data: row, error: null };
  } catch (e: any) {
    console.error("[mock createConsultingRequest] failed:", e);
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}