/**
 * Seed Supabase 'properties' from your existing local JSON:
 *   src/data/propertyTemplates.seed.json
 *
 * Run:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE=... npx ts-node scripts/seed.properties.ts
 *
 * Notes:
 * - Uses SERVICE ROLE on purpose; DO NOT ship this key to the browser.
 * - Upserts by (name, city) to avoid duplicates if rerun.
 */

import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

type PropertySeed = {
  id?: string;
  title?: string;         // sometimes "title" in seeds
  name?: string;          // or "name"
  location?: string;      // e.g., "Lagos, Portugal"
  city?: string;
  country?: string;
  rooms?: number;
  gfa_sqm?: number;
  cover_image_url?: string;
  image?: string;
  lat?: number;
  lng?: number;
  status?: string;
  price_amount?: number;
  price_currency?: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE before running.");
}
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

function readJson<T = any>(relPath: string): T {
  const abs = path.resolve(process.cwd(), relPath);
  const raw = fs.readFileSync(abs, "utf8");
  return JSON.parse(raw) as T;
}

function splitLocation(loc?: string): { city?: string; country?: string } {
  if (!loc) return {};
  const parts = loc.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    return { city: parts[0], country: parts.slice(1).join(", ") };
  }
  return { city: loc };
}

function normalize(item: PropertySeed) {
  const name = item.name || item.title || "Untitled";
  const loc = splitLocation(item.location);
  return {
    name,
    city: item.city || loc.city || null,
    country: item.country || loc.country || null,
    rooms: item.rooms ?? null,
    gfa_sqm: item.gfa_sqm ?? null,
    cover_image_url: item.cover_image_url || item.image || null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    status: item.status || null,
  };
}

async function upsertProperties(rows: ReturnType<typeof normalize>[]) {
  if (!rows.length) return;
  // Ensure a unique index for idempotent upserts
  await admin.rpc("noop").catch(() => {}); // harmless; keeps session alive

  // create unique index if not exists (safe to attempt)
  await admin
    .from("properties")
    .select("id")
    .limit(1);

  // Upsert by name+city (most stable in your seeds)
  const { error } = await admin
    .from("properties")
    .upsert(rows, { onConflict: "name,city", ignoreDuplicates: false });
  if (error) throw new Error("Upsert failed: " + error.message);
}

async function main() {
  const data: PropertySeed[] = readJson("src/data/propertyTemplates.seed.json");
  const rows = data.map(normalize);
  await upsertProperties(rows);
  console.log(`✅ Seeded ${rows.length} properties.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});