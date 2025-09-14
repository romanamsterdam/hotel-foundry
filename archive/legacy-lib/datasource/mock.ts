import { DataSource, Project, RoadmapTask, ConsultingRequest, UUID } from "./types";
import type { ConsultingRequestInput } from "../types/consulting";

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

export function createConsultingRequest(input: ConsultingRequestInput): ConsultingRequest {
  const req: ConsultingRequest = {
    id: genId("c"),
    user_id: input.user_id ?? null,
    message: input.message ?? "",
    notes: null,
    status: "unread",
    assignee: input.assignee ?? null,
    created_at: new Date().toISOString()
  };
  store.consulting.push(req);
  persist();
  return req;
}

export const mockDs: DataSource = {
  async listProjects() { return [...store.projects]; },
  async createProject(name: string) {
    const p: Project = { id: genId("p"), name, created_at: new Date().toISOString() };
    store.projects.push(p); persist(); return p;
  },
  async listTasks(projectId: UUID) { return store.tasks.filter(t => t.project_id === projectId); },
  async upsertTask(input) {
    let t = store.tasks.find(x => x.id === input.id);
    if (!t) { t = { id: genId("t"), project_id: input.project_id, title: input.title, status: "not_started" } as RoadmapTask; store.tasks.push(t); }
    Object.assign(t, input); persist(); return t!;
  },
  async listConsulting() { return [...store.consulting]; },
  async updateConsulting(id, patch) {
    const c = store.consulting.find(x => x.id === id);
    if (!c) throw new Error("Not found");
    Object.assign(c, patch); persist(); return c;
  },
};