import { supabase } from "../../lib/supabaseClient";
import type { ProjectInput } from "../../types/projects";
import type { DataSource, Project, RoadmapTask, ConsultingRequest, UUID } from "./types";

// ---- helpers (single copy) ----
const normalizeProjectInput = (input: string | ProjectInput) => {
  if (typeof input === "string") {
    return { property_id: null, name: input, stage: null, currency: null, kpis: null };
  }
  return {
    property_id: input.property_id ?? null,
    name: input.name,
    stage: input.stage ?? null,
    currency: input.currency ?? null,
    kpis: input.kpis ?? null,
  };
};

async function createProjectUnified(
  input: string | ProjectInput
): Promise<{ data: any | null; error?: string | null }> {
  const payload = normalizeProjectInput(input);
  const { data: userData } = await supabase.auth.getUser();
  console.log("[createProject][supabase] user", userData?.user?.id ?? null, "payload", payload);
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error("[createProject][supabase] insert error:", error, { payload });
      return { data: null, error: error.message };
    }
    console.log("[createProject][supabase] inserted id", data?.id);
    return { data, error: null };
  } catch (e: any) {
    console.error("[createProject][supabase] threw:", e, { payload });
    return { data: null, error: e?.message ?? "insert_failed" };
  }
}

// ---- datasource impl (single source of truth) ----
export const supabaseDs: DataSource = {
  async listProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as Project[];
  },

  // unified signature: string | ProjectInput
  async createProject(input: string | ProjectInput): Promise<Project> {
    const { data, error } = await createProjectUnified(input);
    if (error) throw new Error(error);
    return data as Project;
  },

  async listTasks(project_id: UUID): Promise<RoadmapTask[]> {
    const { data, error } = await supabase
      .from("roadmap_tasks")
      .select("*")
      .eq("project_id", project_id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as RoadmapTask[];
  },

  async upsertTask(
    input: Partial<RoadmapTask> & { id?: UUID; project_id: UUID; title: string }
  ): Promise<RoadmapTask> {
    if (input.id) {
      const { data, error } = await supabase
        .from("roadmap_tasks")
        .update(input)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapTask;
    } else {
      const { data, error } = await supabase
        .from("roadmap_tasks")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapTask;
    }
  },

  async listConsulting(): Promise<ConsultingRequest[]> {
    const { data, error } = await supabase
      .from("consulting_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ConsultingRequest[];
  },

  async updateConsulting(id: UUID, patch: Partial<ConsultingRequest>): Promise<ConsultingRequest> {
    const { data, error } = await supabase
      .from("consulting_requests")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ConsultingRequest;
  },
};