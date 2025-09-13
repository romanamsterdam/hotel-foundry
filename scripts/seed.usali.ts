/**
 * Seeds public.usali_cost_benchmarks from your mock files.
 * RUN FROM TERMINAL (NOT SQL EDITOR):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE=... npx ts-node scripts/seed.usali.ts
 */

import "./seedPolyfills";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE env vars.");
}
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

type UsaliRow = {
  country_code?: string | null;
  country?: string | null;
  category: string;
  metric: string;
  low?: number | null;
  mid?: number | null;
  high?: number | null;
  currency?: string | null;
  notes?: string | null;
};

const argPath = process.argv[2]; // allow: npm run seed:usali -- src/path/to/file.json
const CANDIDATES = [
]
const CANDIDATES = argPath ? [argPath] : [
  "src/data/benchmarks/usali.json",
  "src/data/benchmarks/usali.ts",
  "src/lib/data/benchmarks/usali.json",
  "src/lib/data/benchmarks/usali.ts",
  "src/features/benchmarks/usali.json",
  "src/features/benchmarks/usali.ts",
  // last resort: client service that may touch localStorage
  "src/features/benchmarks/dataService.ts"
];

function exists(p: string) { return fs.existsSync(path.resolve(process.cwd(), p)); }

async function safeImportModule(p: string): Promise<any | null> {
  const abs = path.resolve(process.cwd(), p);
  try {
    if (p.endsWith(".json")) return JSON.parse(fs.readFileSync(abs, "utf8"));
    const mod = await import(pathToFileURL(abs).href);
    return (mod as any).default ?? mod;
  } catch {
    return null;
  }
}

function pickArray(mod: any, primaryKeys: string[]): any[] {
  if (!mod) return [];
  // Direct array export?
  if (Array.isArray(mod) && mod.length) return mod;
  // Common nested shapes
  if (Array.isArray(mod.usali)) return mod.usali;
  if (mod.data && Array.isArray(mod.data.usali)) return mod.data.usali;
  // Heuristic fallback: find any exported array with the expected keys
  for (const v of Object.values(mod)) {
    if (Array.isArray(v) && v.length && typeof v[0] === "object") {
      const keys = Object.keys(v[0]);
      if (primaryKeys.every(k => keys.includes(k))) return v;
    }
  }
  return [];
}

async function loadUsali(): Promise<any[]> {
  for (const p of CANDIDATES) {
    if (!exists(p)) continue;
    const mod = await safeImportModule(p);
    const rows = pickArray(mod, ["category", "metric"]); // USALI fingerprint
    if (rows.length) {
      console.log("Using USALI source:", p, "count:", rows.length);
      return rows;
    }
  }
  console.log("No USALI source found in candidates.");
  return [];
}

function num(v: any) { const n = Number(v); return Number.isFinite(n) ? n : null; }

function norm(x: any) {
  const country_code = x.country_code ?? x.country ?? null;
  const category = x.category ?? x.cat ?? x.group ?? "General";
  const metric = x.metric ?? x.name ?? x.key ?? "Cost%Rev";
  const low = num(x.low ?? x.min);
  const mid = num(x.mid ?? x.avg ?? x.mean);
  const high = num(x.high ?? x.max);
  const currency = x.currency ?? "EUR";
  const notes = x.notes ?? null;
  return { country_code, category, metric, low, mid, high, currency, notes };
}

async function upsertUsali(rows: ReturnType<typeof norm>[]) {
  if (!rows.length) return console.log("USALI: nothing to seed.");
  const { error } = await admin
    .from("usali_cost_benchmarks")
    .upsert(rows, { onConflict: "country_code,category,metric", ignoreDuplicates: false });
  if (error) throw new Error("USALI upsert failed: " + error.message);
  console.log(`✅ Seeded/updated ${rows.length} USALI rows.`);
}

(async function main() {
  const src = await loadUsali();
  const rows = src.map(norm);
  await upsertUsali(rows);
})().catch(e => { console.error(e); process.exit(1); });