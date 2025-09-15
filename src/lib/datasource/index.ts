import { env } from "../../lib/env";
import type { DataSource } from "./types";
import { supabase } from "../supabaseClient";
export * from "./types";

// stubs; real impls added next
let impl: DataSource;
export const setDs = (ds: DataSource) => { impl = ds; };
export const getDs = (): DataSource => impl as DataSource;

// Re-export project functions for UI
export const createProject = async (input: string | ProjectInput) => {
  if (!impl?.createProject) {
    throw new Error("DataSource not initialized");
  }
  return impl.createProject(input);
};

export const saveProject = async (input: ProjectInput) => {
  if (!impl?.saveProject) throw new Error("DataSource not initialized");
  try {
    console.info("[saveProject] input →", input);
    const row = await impl.saveProject(input);
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
  if (impl?.listMyProjects) return impl.listMyProjects();
  if (impl?.listProjects) {
    const rows = await impl.listProjects();
    return { data: rows, error: null };
  }
  throw new Error("DataSource not initialized");
};

export const initDataSource = async () => {
  console.log("[datasource] selecting:", env.DATA_SOURCE);
  if (env.DATA_SOURCE === "supabase") {
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !supabase) {
      throw new Error("SUPABASE_MISSING_CONFIG");
    }
    const { supabaseDs } = await import("./supabase");
    setDs(supabaseDs);
    console.log("[datasource] initialized: supabase");
  } else {
    const { mockDs } = await import("./mock");
    setDs(mockDs);
    console.log("[datasource] initialized: mock");
  }
};