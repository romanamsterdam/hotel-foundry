import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultRoadmap } from "../data/roadmapSteps";

/** Four statuses required by spec */
export type TaskStatus = "Not started" | "In progress" | "Done" | "Stuck";

export type UserTask = {
  id: string;          // unique per task
  chapterId: string;   // maps to defaultRoadmap[].id (e.g., "concept")
  title: string;       // the item text from defaultRoadmap
  status: TaskStatus;
  due?: string;        // ISO date
  owner?: string;
  comment?: string;
};

type State = {
  /** Keyed by projectId OR "explore" */
  tasksByProject: Record<string, UserTask[]>;
  /** Chapter filter selection */
  activeChapterId?: string;

  /** Init from defaultRoadmap (idempotent) */
  ensureProjectTasks: (projectKey: string) => void;
  setActiveChapter: (chapterId?: string) => void;
  /** Mutations */
  updateTask: (projectKey: string, taskId: string, patch: Partial<UserTask>) => void;
  /** Save all tasks for a project */
  saveTasks: (projectKey: string) => Promise<void>;
};

export const useUserRoadmapTasks = create<State>()(
  persist(
    (set, get) => ({
      tasksByProject: {},
      activeChapterId: undefined,

      ensureProjectTasks: (projectKey) => {
        const state = get();
        if (state.tasksByProject[projectKey]?.length) return;
        // Flatten defaultRoadmap items to editable user tasks
        const flattened: UserTask[] = defaultRoadmap.flatMap((phase) =>
          phase.items.map((title, idx) => ({
            id: `${phase.id}:${idx}`,
            chapterId: phase.id,
            title,
            status: "Not started" as TaskStatus,
          }))
        );
        set({ tasksByProject: { ...state.tasksByProject, [projectKey]: flattened } });
        // also set first chapter active by default
        set({ activeChapterId: defaultRoadmap[0]?.id });
      },

      setActiveChapter: (chapterId) => set({ activeChapterId: chapterId }),

      updateTask: (projectKey, taskId, patch) => {
        const state = get();
        const list = state.tasksByProject[projectKey] || [];
        const next = list.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
        set({ tasksByProject: { ...state.tasksByProject, [projectKey]: next } });
      },

      saveTasks: async (projectKey) => {
        // Simulate save delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        // Data is already persisted via zustand persist middleware
        // In the future, this would sync to Supabase
      },
    }),
    { name: "hf-user-roadmap" }
  )
);