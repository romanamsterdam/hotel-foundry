import { useCallback, useEffect, useState } from "react";
import { getSupabase, clearSupabaseAuthStorage } from "../../lib/supabase/client";

export default function AuthDebug() {
  const supabase = getSupabase();
  const [sessionJSON, setSessionJSON] = useState<string>("(loading)");
  const [lsKeys, setLsKeys] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const url = window.location.href;
    const hash = window.location.hash;
    const qs = window.location.search;
    const { data, error } = await supabase.auth.getSession();
    setSessionJSON(
      JSON.stringify(
        {
          location: { url, hash, qs },
          session: {
            hasSession: !!data.session,
            access_token: data.session?.access_token ? "(present)" : null,
            refresh_token: data.session?.refresh_token ? "(present)" : null,
            user: data.session?.user ?? null,
          },
          error: error ?? null,
        },
        null,
        2
      )
    );
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("sb-") || k === "hf-auth-v1");
    setLsKeys(keys);
    console.log("[/auth/debug] session", data, "error", error);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-black text-white" onClick={refresh}>Refresh</button>
        <button
          className="px-3 py-1 rounded border"
          onClick={async () => {
            await supabase.auth.signOut();
            await refresh();
          }}
        >
          Sign out
        </button>
        <button
          className="px-3 py-1 rounded border"
          onClick={() => {
            clearSupabaseAuthStorage();
            window.location.reload();
          }}
        >
          Clear auth storage & reload
        </button>
      </div>

      <div>
        <h3 className="font-medium mb-1">LocalStorage keys</h3>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(lsKeys, null, 2)}</pre>
      </div>

      <div>
        <h3 className="font-medium mb-1">Session</h3>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{sessionJSON}</pre>
      </div>
    </div>
  );
}
