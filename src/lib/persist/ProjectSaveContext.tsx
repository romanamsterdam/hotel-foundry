import React, { createContext, useContext, useRef } from "react";
import { saveProject } from "../datasource";
import type { Project } from "../datasource";
import { useToast } from "../../components/ui/toast";

export type PersistPayload = {
  id?: string;               // present when updating
  name: string;
  property_id?: string | null;
  stage?: string | null;
  currency?: string | null;
  kpis: Record<string, any> | null;
};

type Ctx = {
  saveNow: (source: string) => Promise<Project | void>;
  saving: boolean;
};

const ProjectSaveCtx = createContext<Ctx | null>(null);

type ProviderProps = {
  buildPayload: () => PersistPayload;
  onSaved?: (row: Project) => void;  // e.g., to adopt id on first save
  children: React.ReactNode;
};

export function ProjectSaveProvider({ buildPayload, onSaved, children }: ProviderProps) {
  const { toast } = useToast();
  const savingRef = useRef(false);
  const debounceRef = useRef<number | undefined>(undefined);

  async function saveNow(source: string) {
    if (savingRef.current) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    return new Promise<Project | void>((resolve, reject) => {
      debounceRef.current = window.setTimeout(async () => {
        try {
          savingRef.current = true;
          const payload = buildPayload();
          const row = await saveProject(payload);
          toast.success(`Saved (${source})`);
          onSaved?.(row);
          resolve(row);
        } catch (e: any) {
          console.error(`[ProjectSave] ${source} failed`, e);
          toast.error(e?.message ?? "Save failed");
          reject(e);
        } finally {
          savingRef.current = false;
        }
      }, 150);
    });
  }

  return (
    <ProjectSaveCtx.Provider value={{ saveNow, saving: savingRef.current }}>
      {children}
    </ProjectSaveCtx.Provider>
  );
}

export function useProjectSave() {
  const ctx = useContext(ProjectSaveCtx);
  if (!ctx) throw new Error("useProjectSave must be used within ProjectSaveProvider");
  return ctx;
}