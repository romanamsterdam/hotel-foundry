import { create } from "zustand";
import { roadmapApi } from "./dataService";
import { computeCriticalPath } from "./criticalPath";
import type { RoadmapProject, RoadmapChapter, RoadmapStep, RoadmapSnapshot } from "./types";

type State = {
  // data
  projects: RoadmapProject[];
  currentProjectId: string | null;
  chapters: RoadmapChapter[];
  steps: RoadmapStep[];
  snapshot?: RoadmapSnapshot;

  // ui
  selectedStepId: string | null;

  // actions
  refresh: () => void;
  setCurrentProject: (id: string) => void;
  ensureProjectSelected: () => void;
  setSelectedStep: (id: string | null) => void;
  upsertChapter: (c: RoadmapChapter) => void;
  deleteChapter: (id: string) => void;
  upsertStep: (s: RoadmapStep) => void;
  deleteStep: (id: string) => void;
  publish: () => void;
  recomputeCritical: () => void;
};

export const useRoadmapStore = create<State>((set, get) => ({
  // data
  projects: roadmapApi.listProjects(),
  currentProjectId: roadmapApi.listProjects()[0]?.id ?? null,
  chapters: [],
  steps: [],
  snapshot: undefined,

  // ui
  selectedStepId: null,

  // actions
  refresh: () => {
    const id = get().currentProjectId;
    if (!id) return;
    set({
      projects: roadmapApi.listProjects(),
      chapters: roadmapApi.listChapters(id),
      steps: roadmapApi.listSteps(id),
      snapshot: roadmapApi.getLatestSnapshot(id),
    });
  },

  setCurrentProject: (id: string) => {
    const prev = get().currentProjectId;
    if (prev === id) return;         // no-op if unchanged
    set({ currentProjectId: id });   // pure setter only
  },

  ensureProjectSelected: () => {
    const state = get();
    if (!state.currentProjectId) {
      const first = state.projects?.[0]?.id ?? null;
      if (first && first !== state.currentProjectId) {
        set({ currentProjectId: first });
      }
    }
  },

  setSelectedStep: (id) => set({ selectedStepId: id }),

  upsertChapter: (c) => { 
    roadmapApi.upsertChapter(c); 
    get().refresh(); 
  },
  
  deleteChapter: (id) => { 
    roadmapApi.deleteChapter(id); 
    get().refresh(); 
  },
  
  upsertStep: (s) => { 
    roadmapApi.upsertStep(s); 
    get().refresh(); 
  },
  
  deleteStep: (id) => { 
    roadmapApi.deleteStep(id); 
    get().refresh(); 
  },

  publish: () => {
    const id = get().currentProjectId;
    if (!id) return;
    roadmapApi.publish(id);
    get().refresh();
  },

  recomputeCritical: () => {
    const steps = get().steps;
    const { criticalIds } = computeCriticalPath(steps);
    steps.forEach(s => roadmapApi.upsertStep({ ...s, critical: criticalIds.has(s.id) }));
    get().refresh();
  },
}));