import { supabase } from "../../lib/supabaseClient";
import type { ProjectInput } from "../../types/projects";

function coerceConsulting(input: any) {
  const raw = input.estimated_hours;
  const hours = raw === '' || raw == null ? null : Number(raw);
  return {
    name: input.name ?? null,
    email: input.email ?? null,
    expertise: input.expertise,
    seniority: input.seniority,
    estimated_hours: Number.isFinite(hours) ? hours : null,
    message: input.message ?? null,
    user_id: input.user_id ?? null,
    assignee: input.assignee ?? null,
  };
}

export async function createProject(input: ProjectInput): Promise<{data: any|null; error?: string|null}> {
  const payload = {
    property_id: input.property_id ?? null,
    name: input.name,
    stage: input.stage ?? null,
    currency: input.currency ?? null,
    kpis: input.kpis ?? null,
    // owner_id intentionally omitted; DB trigger sets it
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[createProject] supabase error:", error, { payload });
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function listMyProjects(): Promise<{data: any[]; error?: string|null}> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("[listMyProjects] supabase error:", error);
    return { data: [], error: error.message };
  }
  return { data, error: null };
}

export const supabaseDs: DataSource = {
  async listProjects(): Promise<Project[]> {
    const { data, error } = await supabase!.from("projects")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as Project[];
  },

  async createProject(name: string): Promise<Project> {
    const { data, error } = await supabase!.from("projects")
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  async listTasks(project_id: UUID): Promise<RoadmapTask[]> {
    const { data, error } = await supabase!.from("roadmap_tasks")
      .select("*")
      .eq("project_id", project_id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as RoadmapTask[];
  },

  async upsertTask(input: Partial<RoadmapTask> & { id?: UUID; project_id: UUID; title: string }): Promise<RoadmapTask> {
    if (input.id) {
      const { data, error } = await supabase!.from("roadmap_tasks")
        .update(input)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapTask;
    } else {
      const { data, error } = await supabase!.from("roadmap_tasks")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapTask;
    }
  },

  async listConsulting(): Promise<ConsultingRequest[]> {
    const { data, error } = await supabase!.from("consulting_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ConsultingRequest[];
  },

  async updateConsulting(id: UUID, patch: Partial<ConsultingRequest>): Promise<ConsultingRequest> {
    const { data, error } = await supabase!.from("consulting_requests")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ConsultingRequest;
  },
};