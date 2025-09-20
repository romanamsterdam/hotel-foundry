import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase/client";

export default function AuthDebug() {
  const supabase = getSupabase();
  const [sessionJSON, setSessionJSON] = useState<string>("(loading)");

  useEffect(() => {
    (async () => {
      const url = window.location.href;
      const hash = window.location.hash;
      const qs = window.location.search;
      const { data, error } = await supabase.auth.getSession();
      setSessionJSON(
        JSON.stringify(
          {
            href: url,
            query: qs,
            hash,
            error: error?.message ?? null,
            session: {
              access_token: data.session?.access_token ? "(present)" : null,
              refresh_token: data.session?.refresh_token ? "(present)" : null,
              user: data.session?.user ?? null,
            },
          },
          null,
          2
        )
      );
      console.log("[/auth/debug] session", data, "error", error);
    })();
  }, [supabase]);

  return <pre className="p-4 text-xs overflow-auto">{sessionJSON}</pre>;
}