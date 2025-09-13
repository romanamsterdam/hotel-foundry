// src/lib/deals/normalizers.ts
import type { RoomBreakdownItem } from "../../types/property";
import type { PropertyBase, RoomTypeItem } from "../types/property";

// Valid facility keys for normalization
export type FacilityKey =
  | "wifi" | "pool" | "gym" | "spa" | "parking"
  | "restaurant" | "bar" | "beach" | "conference" 
  | "kidsClub" | "other";

export type Facility = { key: FacilityKey; label: string };

const FACILITY_ALIASES: Record<string, FacilityKey> = {
  "other": "other",
  "others": "other", 
  "misc": "other",
  "miscellaneous": "other",
  "meeting & events": "conference",
  "meetings": "conference",
  "events": "conference",
  "kids club": "kidsClub",
  "kidsclub": "kidsClub",
};

const VALID_FACILITIES = new Set<FacilityKey>([
  "wifi", "pool", "gym", "spa", "parking", "restaurant", "bar", 
  "beach", "conference", "kidsClub", "other"
]);

export function normalizeFacilities(input?: Array<string | Facility> | null): Facility[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<FacilityKey>();
  const out: Facility[] = [];

  for (const item of input) {
    let key: FacilityKey | undefined;
    let label = "";

    if (typeof item === "string") {
      const raw = item.trim();
      const lower = raw.toLowerCase();
      key = FACILITY_ALIASES[lower] ?? (VALID_FACILITIES.has(lower as FacilityKey) ? (lower as FacilityKey) : undefined);
      label = raw;
    } else if (item && typeof item === "object") {
      const rawLabel = item.label?.trim() ?? "";
      const rawKey = (item.key as string | undefined)?.toLowerCase?.() ?? "";
      key = FACILITY_ALIASES[rawKey] ?? (item.key as FacilityKey);
      label = rawLabel;
    }

    if (!key || !label || !VALID_FACILITIES.has(key)) continue;
    if (key === "other") label = "Other"; // Enforce single, nice label
    if (seen.has(key)) continue; // De-dupe
    seen.add(key);
    out.push({ key, label });
  }
  return out;
}

/** Normalize room breakdown to have safe types and counts */
export function normalizeRooms(input?: { type?: string; count?: number }[] | null): RoomBreakdownItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(Boolean)
    .map((r, i) => ({
      type: String(r?.type ?? `Room ${i + 1}`).trim(),
      count: Number.isFinite(r?.count as number) ? (r!.count as number) : 0,
    }));
}

/** Normalize room array to have ids and numeric counts */
export function normalizeRoomTypes(rooms?: RoomTypeItem[]): RoomTypeItem[] {
  return (rooms ?? []).map((r) => ({
    id: r.id || crypto.randomUUID(),
    name: r.name,
    count: Number(r.count) || 0,
    sqm: r.sqm,
    adrBase: r.adrBase,
  }));
}

/** Sum of room breakdown items (canonical) */
export function computeTotalRoomsFromBreakdown(rooms?: RoomBreakdownItem[]): number {
  return Array.isArray(rooms)
    ? rooms.reduce((s, r) => s + (Number(r.count) || 0), 0)
    : 0;
}

/** Sum of rooms (for RoomTypeItem[]) */
export function computeTotalRooms(rooms?: RoomTypeItem[]): number {
  return Array.isArray(rooms)
    ? rooms.reduce((s, r) => s + (Number(r.count) || 0), 0)
    : 0;
}

/** Back-compat alias: some files may import computeTotalRooms for breakdown items */
export const computeTotalRoomsFromBreakdownAlias = computeTotalRoomsFromBreakdown;

/** Canonicalize purchase price: collapse legacy `price` -> `purchasePrice`, drop `price` */
export function withUnifiedPurchasePrice<T extends { purchasePrice?: number; price?: number }>(obj: T): T {
  const out: any = { ...obj };
  if (out.price != null && out.purchasePrice == null) {
    out.purchasePrice = Number(out.price) || 0;
  }
  delete out.price; // prevent double-terms in UI
  return out;
}

/** Safe helpers for rendering facilities */
export function facilityLabel(f: string | Facility | null | undefined): string {
  if (!f) return "";
  if (typeof f === "string") return f;
  return f.label ?? String(f.key ?? "");
}

export function facilityKey(f: string | Facility | null | undefined): string {
  if (!f) return "";
  return typeof f === "string" ? f.toLowerCase() : String(f.key);
}

/** Create a user working property/deal from a catalog property */
export function catalogToUserProperty(
  catalog: PropertyBase,
  ownerUserId: string,
  sourceId: string
): UserProperty {
  const unified = withUnifiedPurchasePrice({ ...catalog });

  return {
    ...unified,
    id: crypto.randomUUID(),
    rooms: normalizeRoomTypes(unified.rooms),
    facilities: normalizeFacilities(unified.facilities),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerUserId,
    source: { kind: "catalog", catalogId: sourceId },
  } as UserProperty;
}

/** Normalize location from various property formats */
export function normalizeLocation(property: any): string {
  // Try different location formats
  const city = property.city || property.location?.city || "";
  const country = property.country || property.location?.country || "";
  const address = property.address || property.fullAddress || "";
  
  // Prefer city, country format
  if (city && country) {
    return `${city}, ${country}`;
  }
  
  // Fallback to any available location info
  if (city) return city;
  if (country) return country;
  if (address) return address;
  
  return "Location TBD";
}