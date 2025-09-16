import { env } from "../../lib/env";
import type { DataSource } from "./types";
import { supabase } from "../supabaseClient";
export * from "./types";

// stubs; real impls added next
let DS: DataSource | null = null;

export async function initDataSource(): Promise<DataSource> {
  if (DS) return DS;
  
  console.log("[datasource] selecting:", env.DATA_SOURCE);
  if (env.DATA_SOURCE === "supabase") {
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !supabase) {
      throw new Error("SUPABASE_MISSING_CONFIG");
    }
    const { supabaseDs } = await import("./supabase");
    DS = supabaseDs as DataSource;
    console.log("[datasource] initialized: supabase");
  } else {
    const { mockDs } = await import("./mock");
    DS = mockDs as DataSource;
    console.log("[datasource] initialized: mock");
  }

  // runtime guard: make sure function exists
  if (typeof DS.createConsultingRequest !== "function") {
    throw new Error(
      "[DataSource] createConsultingRequest missing — verify exports in mock/supabase."
    );
  }

  return DS;
}

export function getDataSource(): DataSource {
  if (!DS) throw new Error("[DataSource] Not initialized. Call initDataSource() once at app start.");
  return DS;
}

// Legacy compatibility
export const setDs = (ds: DataSource) => { DS = ds; };
export const getDs = (): DataSource => DS as DataSource;

// Re-export project functions for UI
export const createProject = async (input: string | ProjectInput) => {
  if (!DS?.createProject) {
    throw new Error("DataSource not initialized");
  }
  return DS.createProject(input);
};

export const saveProject = async (input: ProjectInput) => {
  if (!DS?.saveProject) throw new Error("DataSource not initialized");
  try {
    console.info("[saveProject] input →", input);
    const row = await DS.saveProject(input);
    console.info("[saveProject] saved ←", row);
    return row;
  } catch (e: any) {
    console.error("[saveProject] FAILED:", e?.message ?? e);
    throw e;
  }
};

// ---- Debug hook (prod-safe when flagged) ----
if (import.meta.env.VITE_DEBUG_DS === "true") {
  // @ts-ignore
  (window as any).HF = {
    saveProject,
    // optional: expose createProject, getDs for deeper poking
  };
  console.info("[HF] Debug hooks enabled: window.HF.saveProject()");
}
export const listMyProjects = async () => {
  if (DS?.listMyProjects) return DS.listMyProjects();
  if (DS?.listProjects) {
    const rows = await DS.listProjects();
    return { data: rows, error: null };
  }
  throw new Error("DataSource not initialized");
};