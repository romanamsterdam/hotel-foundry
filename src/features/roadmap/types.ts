export type RoadmapStatus = "draft" | "published" | "archived";
export type StepStatus = "not_started" | "in_progress" | "blocked" | "done";

export interface RoadmapProject {
  id: string;
  title: string;
  version: number;            // auto-increment on publish
  status: RoadmapStatus;      // draft/published/archived
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  notes?: string;
}

export interface RoadmapChapter {
  id: string;
  projectId: string;
  order: number;
  title: string;
  description?: string;
}

export interface RoadmapStep {
  id: string;
  projectId: string;
  chapterId: string;
  order: number;
  title: string;
  description?: string;
  owner?: string;             // "Role" or person (GM, PM, QS, Architect, etc.)
  type?: string;              // e.g., "Permits", "Design", "Financing"
  status: StepStatus;
  percentComplete?: number;   // 0..100
  startDate?: string;         // ISO
  dueDate?: string;           // ISO
  durationDays?: number;      // computed if dates missing
  costEstimate?: number;      // optional
  milestone?: boolean;
  critical?: boolean;         // computed flag based on path
  dependsOnIds: string[];     // DAG dependencies
  externalLinks?: { label: string; url: string }[];
  files?: { name: string; placeholderId: string }[]; // placeholder files (upload later)
}

export interface RoadmapSnapshot {
  project: RoadmapProject;
  chapters: RoadmapChapter[];
  steps: RoadmapStep[];
  generatedAt: string;        // ISO
}