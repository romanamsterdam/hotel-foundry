import { supabase } from "../../lib/supabaseClient";

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

export async function createConsultingRequest(
  input: any
): Promise<{ data: ConsultingRequest | null; error?: string | null }> {
  try {
    const payload = coerceConsulting(input);
    
    const { data, error } = await supabase!
      .from("consulting_requests")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[supabase createConsultingRequest] error:", error);
      return { data: null, error: error.message };
    }
    return { data: data as ConsultingRequest, error: null };
  } catch (e: any) {
    console.error("[supabase createConsultingRequest] threw:", e);
    return { data: null, error: e?.message ?? "Unexpected error" };
  }
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