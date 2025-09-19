import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase/client";

export function useDisplayName() {
  const supabase = getSupabase();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const u = auth.user;
      if (!u) { if (mounted) setName(null); return; }

      // fallback chain: profiles.full_name -> user_metadata.full_name -> email
      let best = (u.user_metadata?.full_name as string) || u.email || null;

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.id)
        .maybeSingle();

      if (prof?.full_name) best = prof.full_name;

      if (mounted) setName(best);
    })();
    return () => { mounted = false; };
  }, [supabase]);

  return name; // can be null while loading
}