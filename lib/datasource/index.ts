import { env } from "../../lib/env";
import type { DataSource } from "./types";
export * from "./types";

// stubs; real impls added next
let impl: DataSource;
export const setDs = (ds: DataSource) => { impl = ds; };
export const getDs = (): DataSource => impl as DataSource;

export const initDataSource = async () => {
  if (env.DATA_SOURCE === "supabase") {
    const { supabaseDs } = await import("./supabase");
    setDs(supabaseDs);
  } else {
    const { mockDs } = await import("./mock");
    setDs(mockDs);
  }
};