import { supabase } from "../../lib/supabaseClient";

export type Seniority = "junior" | "standard" | "partner";

export type ConsultingRequestInput = {
  name?: string;
  email: string;
  company?: string;
  summary: string;
  expertise: string[];       // ["operations","finance",...]
  seniority: Seniority;      // "junior" | "standard" | "partner"
  hourly: number;            // 80 | 150 | 300
  hoursHint?: string;        // "2" etc
};

export async function submitConsultingRequest(input: ConsultingRequestInput) {
  // Map to DB columns
  const row = {
    name: input.name ?? null,
    email: input.email,
    company: input.company ?? null,
    message: input.summary,
    status: "new",
    assignee: null,
    seniority: input.seniority,
    hourly: input.hourly,
    expertise: input.expertise?.length ? input.expertise : null,
    hours_hint: input.hoursHint ?? null,
    source: "web",
  };

  const { data, error } = await supabase
    .from("consulting_requests")
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}