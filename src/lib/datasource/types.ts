export type UUID = string;

export type Project = {
  id: UUID;
  name: string;
  owner?: string | null;
  created_at?: string;
};

// Minimal input used by underwriting save.
export type ProjectInput = {
  id?: UUID;                 // present when updating
  property_id?: UUID | null;
  name: string;
  stage?: string | null;     // or your enum
  currency?: string | null;
  kpis?: Record<string, any> | null; // JSONB of KPIs
};

export type TaskStatus = "not_started" | "in_progress" | "done" | "stuck";

export type RoadmapTask = {
  id: UUID;
  project_id: UUID;
  title: string;
  status: TaskStatus;
  owner?: string | null;
  due_date?: string | null;
  comment?: string | null;
  created_at?: string;
};

export type ConsultingStatus =
  | "unread"
  | "proposal_submitted"
  | "declined"
  | "in_progress"
  | "completed";

export type ConsultingRequest = {
  id: UUID;
  user_id?: string | null;
  message: string;
  notes?: string | null;
  status: ConsultingStatus;
  assignee?: string | null;
  created_at?: string;
};

export interface DataSource {
  listProjects(): Promise<Project[]>;
  // Create-only helper (still supported)
  createProject(input: string | ProjectInput): Promise<Project>;
  // New: single entrypoint used by Underwriting Save.
  saveProject(input: ProjectInput): Promise<Project>;
  listTasks(projectId: UUID): Promise<RoadmapTask[]>;
  upsertTask(input: Partial<RoadmapTask> & { id?: UUID; project_id: UUID; title: string }): Promise<RoadmapTask>;
  listConsulting(): Promise<ConsultingRequest[]>;
  updateConsulting(id: UUID, patch: Partial<ConsultingRequest>): Promise<ConsultingRequest>;
}