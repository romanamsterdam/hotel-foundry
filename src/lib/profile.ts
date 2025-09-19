import { supabase } from "@/lib/supabaseClient";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription: "free" | "starter" | "pro" | "beta" | null;
};

export async function getMyProfile(): Promise<{data: Profile|null; error?: string|null}> {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user?.id;
  if (!uid) return { data: null, error: "No session" };
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,subscription")
    .eq("id", uid)
    .single();
  return { data: (data as any) ?? null, error: error?.message ?? null };
}

export async function updateMyName(full_name: string) {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user?.id;
  if (!uid) return { error: "No session" };
  const { error } = await supabase.from("profiles").update({ full_name }).eq("id", uid);
  return { error: error?.message ?? null };
}

export async function changeMyPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}