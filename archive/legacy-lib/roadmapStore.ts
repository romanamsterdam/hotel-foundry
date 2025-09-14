import type { Project, ProjectRoadmap, RoadmapComment, StepStatus } from "../types/roadmap";
import { MOCK_PROJECTS, seedRoadmap } from "../data/mock/roadmapSeed";

const PKEY = "hf_projects";
const RKEY = (pid: string) => `hf_roadmap_${pid}`;
const SELKEY = "hf_selected_project";

export function getProjects(): Project[] {
  const raw = localStorage.getItem(PKEY);
  if (raw) try { return JSON.parse(raw); } catch {}
  localStorage.setItem(PKEY, JSON.stringify(MOCK_PROJECTS));
  return MOCK_PROJECTS;
}

export function upsertProject(p: Project) {
  const list = getProjects();
  const idx = list.findIndex(x => x.id === p.id);
  if (idx >= 0) list[idx] = p; else list.push(p);
  localStorage.setItem(PKEY, JSON.stringify(list));
}

export function getSelectedProjectId(): string | null {
  return localStorage.getItem(SELKEY);
}

export function setSelectedProjectId(id: string | null) {
  if (id) localStorage.setItem(SELKEY, id); else localStorage.removeItem(SELKEY);
}

export function getRoadmap(projectId: string): ProjectRoadmap {
  const raw = localStorage.getItem(RKEY(projectId));
  if (raw) try { return JSON.parse(raw); } catch {}
  const seeded = seedRoadmap(projectId);
  localStorage.setItem(RKEY(projectId), JSON.stringify(seeded));
  return seeded;
}

function saveRoadmap(r: ProjectRoadmap) {
  r.updatedAt = new Date().toISOString();
  localStorage.setItem(RKEY(r.projectId), JSON.stringify(r));
}

export function updateStepStatus(projectId: string, stepId: string, status: StepStatus) {
  const r = getRoadmap(projectId);
  const s = r.steps.find(x => x.id === stepId);
  if (s) { s.status = status; saveRoadmap(r); }
  return r;
}

export function updateStepOwner(projectId: string, stepId: string, owner: string) {
  const r = getRoadmap(projectId);
  const s = r.steps.find(x => x.id === stepId);
  if (s) { s.owner = owner; saveRoadmap(r); }
  return r;
}

export function addStepComment(projectId: string, stepId: string, text: string, author = "You") {
  const r = getRoadmap(projectId);
  const s = r.steps.find(x => x.id === stepId);
  if (s) {
    const c: RoadmapComment = { id: crypto.randomUUID(), text, author, createdAt: new Date().toISOString() };
    s.comments.push(c);
    saveRoadmap(r);
  }
  return r;
}