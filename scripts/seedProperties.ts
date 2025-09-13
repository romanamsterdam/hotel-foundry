import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL!;
const anon = process.env.VITE_SUPABASE_ANON_KEY!;
if (!url || !anon) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env");
  process.exit(1);
}
const supabase = createClient(url, anon);

type Row = {
  name: string; 
  country?: string; 
  city?: string; 
  rooms?: number; 
  gfa_sqm?: number;
  cover_image_url?: string; 
  lat?: number; 
  lng?: number; 
  status?: string;
};

async function main() {
  const file = path.resolve("src/data/properties.mock.json");
  const raw = fs.readFileSync(file, "utf-8");
  const rows: Row[] = JSON.parse(raw);

  console.log(`Seeding ${rows.length} properties to Supabase...`);

  for (const r of rows) {
    const { data, error } = await supabase.from("properties")
      .upsert(r, { onConflict: "name" })  // id auto-gen; dedupe by name for now
      .select()
      .single();

    if (error) {
      console.error("Upsert error:", error.message, "Row:", r);
      process.exitCode = 1;
    } else {
      console.log("✅ Upserted:", data?.name);
    }
  }

  console.log("Properties seeding complete!");
}

main().catch(e => { 
  console.error("Seeding failed:", e); 
  process.exit(1); 
});