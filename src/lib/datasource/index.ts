import { env } from "../../lib/env";
import type { DataSource } from "./types";
import { supabase } from "../supabaseClient";
export * from "./types";

// stubs; real impls added next
let impl: DataSource;
export const setDs = (ds: DataSource) => { impl = ds; };
export const getDs = (): DataSource => impl as DataSource;

export const initDataSource = async () => {
  console.log("[datasource] selecting:", env.DATA_SOURCE);
  if (env.DATA_SOURCE === "supabase") {
    // Check if Supabase is properly configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !supabase) {
      throw new Error("SUPABASE_MISSING_CONFIG");
    }
    const { supabaseDs } = await import("./supabase");
    setDs(supabaseDs);
    console.log("[datasource] initialized: supabase");
  } else {
    const { mockDs } = await import("./mock");
    setDs(mockDs);
    console.log("[datasource] initialized: mock");
  }
};