import { supabase } from "../../lib/supabaseClient";
import type { DataSource, Project, ProjectInput, RoadmapTask, ConsultingRequest, UUID } from "./types";

const isUuid = (v?: string | null) =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// ---- helpers (single copy) ----
const normalizeProjectInput = (input: string | ProjectInput) => {
  if (typeof input === "string") {
    return { property_id: null, name: input, stage: null, currency: null, kpis: null };
  }
  return {
    property_id: isUuid(input.property_id) ? input.property_id! : null,
    name: input.name,
    stage: input.stage ?? null,
    currency: input.currency ?? null,
    kpis: input.kpis ?? null,
  };
};

async function requireSession() {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return uid;
}

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
      .select("id,name,owner_id:owner_id,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Project[];
  },

  // unified signature: string | ProjectInput
  async createProject(input: string | ProjectInput): Promise<Project> {
    const { data, error } = await createProjectUnified(input);
    if (error) throw new Error(error);
    return data as Project;
  },

  // Single entry point for Underwriting Save
  async saveProject(input: ProjectInput): Promise<Project> {
    await requireSession();
    const payload = normalizeProjectInput(input);
    console.log("[saveProject][supabase] input", input, "payload", payload);
    
    if (input.id) {
      // Update existing
      const { data, error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", input.id)
        .select()
        .single();
      if (error) {
        console.error("[saveProject][supabase] update error:", error, { input, payload });
        throw new Error(error.message);
      }
      console.log("[saveProject][supabase] updated id", data?.id);
      return data as Project;
    }
    
    // Create new
    const { data: userData } = await supabase.auth.getUser();
    const owner_id = userData?.user?.id ?? null;
    const insertRow = owner_id ? { ...payload, owner_id } : payload;
    
    const { data, error } = await supabase
      .from("projects")
      .insert(insertRow)
      .select()
      .single();
    if (error) {
      console.error("[saveProject][supabase] insert error:", error, { input, insertRow });
      throw new Error(error.message);
    }
    console.log("[saveProject][supabase] created id", data?.id);
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