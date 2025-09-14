export type UUID = string;

export type Project = {
  id: UUID;
  name: string;
  owner?: string | null;
  created_at?: string;
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
  createProject(name: string): Promise<Project>;
  listTasks(projectId: UUID): Promise<RoadmapTask[]>;
  upsertTask(input: Partial<RoadmapTask> & { id?: UUID; project_id: UUID; title: string }): Promise<RoadmapTask>;
  listConsulting(): Promise<ConsultingRequest[]>;
  updateConsulting(id: UUID, patch: Partial<ConsultingRequest>): Promise<ConsultingRequest>;
}