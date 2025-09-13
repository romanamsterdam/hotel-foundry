import { supabase } from "./supabaseClient";

export type Property = {
  id: string;
  name: string;
  country?: string;
  city?: string;
  rooms?: number;
  gfa_sqm?: number;
  cover_image_url?: string;
  lat?: number;
  lng?: number;
  status?: string;
  created_at?: string;
};

export async function listProperties(): Promise<Property[]> {
  const { data, error } = await supabase!.from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Property[];
}

export async function upsertProperty(patch: Partial<Property> & { id?: string; name: string }) {
  const { data, error } = await supabase!.from("properties").upsert(patch).select().single();
  if (error) throw error;
  return data as Property;
}