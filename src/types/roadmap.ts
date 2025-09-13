export type StepStatus = "Todo" | "In Progress" | "Blocked" | "Done";

export type RoadmapComment = {
  id: string;
  text: string;
  author: string;            // free text for now
  createdAt: string;         // ISO
};

export type RoadmapStep = {
  id: string;
  title: string;
  status: StepStatus;
  dueDate?: string;          // ISO
  owner?: string;            // free text for now; later -> user id
  comments: RoadmapComment[];
  phaseId: string;
};

export type RoadmapPhase = {
  id: string;
  title: string;
  order: number;
};

export type Project = {
  id: string;
  name: string;
  country?: string;
  city?: string;
};

export type ProjectRoadmap = {
  projectId: string;
  phases: RoadmapPhase[];
  steps: RoadmapStep[];
  version: number;
  updatedAt: string;
};