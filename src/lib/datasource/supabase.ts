import { supabase } from "../../lib/supabaseClient";
import type { DataSource, Project, ProjectInput, RoadmapTask, ConsultingRequest, UUID } from "./types";
import type { ConsultingRequestInput, ConsultingRequestResult } from "./types";

function mapPgError(err: any): string {
  return err?.message ?? "Unknown error";
}

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
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data as Project[];
  },

  async listMyProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    return { data: data ?? [], error: error ? (error.message ?? "Unknown error") : null };
  },

  async getProject(id: string) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    return { data: data ?? null, error: error ? mapPgError(error) : null };
  },

  async upsertProject(input: any) {
    const payload = { ...input };
    // Let DB trigger set owner_id and updated_at
    delete (payload as any).owner_id;
    delete (payload as any).updated_at;

    const { data, error } = await supabase
      .from("projects")
      .upsert(payload, { onConflict: "id", ignoreDuplicates: false })
      .select()
      .single();

    return { data: data ?? null, error: error ? mapPgError(error) : null };
  },

  async deleteProject(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    return { error: error ? mapPgError(error) : null };
  },

  async seedSampleDeals() {
    // Sample deals for current user
    const samples = [
      { 
        id: crypto.randomUUID(), 
        name: "Villa Es Vedra Analysis", 
        stage: "analysis", 
        currency: "EUR", 
        kpis: {
          rooms: 24,
          location: "Ibiza, Spain",
          propertyType: "Boutique",
          starRating: 4,
          purchasePrice: 8500000,
          avgADR: 320,
          avgOccupancy: 75,
          avgRevPAR: 240
        }
      },
      { 
        id: crypto.randomUUID(), 
        name: "Quinta do Mar Analysis", 
        stage: "analysis", 
        currency: "EUR", 
        kpis: {
          rooms: 28,
          location: "Lagos, Portugal",
          propertyType: "Resort",
          starRating: 4,
          purchasePrice: 7200000,
          avgADR: 280,
          avgOccupancy: 70,
          avgRevPAR: 196
        }
      },
      { 
        id: crypto.randomUUID(), 
        name: "Palazzo Siciliano Analysis", 
        stage: "analysis", 
        currency: "EUR", 
        kpis: {
          rooms: 22,
          location: "Taormina, Italy",
          propertyType: "Boutique",
          starRating: 5,
          purchasePrice: 9800000,
          avgADR: 420,
          avgOccupancy: 76,
          avgRevPAR: 319
        }
      }
    ];
    
    const { error, count } = await supabase
      .from("projects")
      .insert(samples, { count: "exact" });

    return { count: count ?? 0, error: error ? mapPgError(error) : null };
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
        .maybeSingle();
      if (error) {
        console.error("[saveProject][supabase] update error:", error, { input, payload });
        throw new Error(error.message);
      }
      if (!data) {
        throw new Error("Project not found for update");
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
      .maybeSingle();
    if (error) {
      console.error("[saveProject][supabase] insert error:", error, { input, insertRow });
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error("Failed to create project");
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
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Task not found for update");
      return data as RoadmapTask;
    } else {
      const { data, error } = await supabase
        .from("roadmap_tasks")
        .insert(input)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Failed to create task");
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
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Consulting request not found");
    return data as ConsultingRequest;
  },

  async createConsultingRequest(input: ConsultingRequestInput) {
    // Shape must match your table columns
    const payload = {
      name: input.name,
      email: input.email,
      expertise: input.expertise,         // enum string on FE
      seniority: input.seniority,         // enum string on FE
      estimated_hours: input.estimatedHours ?? null,
      message: input.message,
      // status omitted — DB will default to 'unread'
    };

    // IMPORTANT: returning:'minimal' so RLS doesn't require SELECT on the inserted row
    const { error } = await supabase
      .from("consulting_requests")
      .insert(payload, { returning: 'minimal' });

    if (error) {
      console.error('[consulting] insert error:', error);
      return { error: error.message };
    }

    // Don't depend on selecting it back - just return success
    return { 
      data: { 
        id: crypto.randomUUID(), // placeholder ID for UI feedback
        created_at: new Date().toISOString() 
      } as ConsultingRequestResult, 
      error: null 
    };
  },
};