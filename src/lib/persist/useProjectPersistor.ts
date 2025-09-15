import { useRef } from "react";
import { saveProject } from "../datasource";
import { useToast } from "../../components/ui/toast";

export type PersistPayload = {
  id?: string;               // present when updating
  name: string;
  property_id?: string | null;
  stage?: string | null;
  currency?: string | null;
  kpis: Record<string, any> | null;
};

export function useProjectPersistor(buildPayload: () => PersistPayload) {
  const { toast } = useToast();
  const saving = useRef(false);
  let debounce: number | undefined;

  async function persistToBackend(source: string): Promise<{ id?: string }> {
    if (saving.current) return {}; // in-flight guard
    
    // Debounce rapid clicks
    if (debounce) window.clearTimeout(debounce);
    
    return new Promise<{ id?: string }>((resolve, reject) => {
      debounce = window.setTimeout(async () => {
        try {
          saving.current = true;
          const payload = buildPayload();
          const saved = await saveProject(payload);
          toast.success(`Saved (${source})`);
          
          // Return saved id for first insert
          resolve({ id: saved?.id });
        } catch (e: any) {
          console.error(`[persist][${source}] failed`, e);
          toast.error(e?.message ?? "Save failed");
          reject(e);
        } finally {
          saving.current = false;
        }
      }, 150);
    });
  }

  return { persistToBackend, isSaving: () => saving.current };
}