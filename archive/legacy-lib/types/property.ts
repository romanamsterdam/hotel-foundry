export type RoomTypeItem = {
  id: string;
  name: string;
  count: number;
  sqm?: number;
  adrBase?: number;
};

export type FacilityKey =
  | "pool" | "spa" | "restaurant" | "bar" | "gym" | "roomService"
  | "parking" | "conference" | "beach" | "kidsClub" | "other";

export type PropertyBase = {
  id: string;
  slug?: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;         // ISO-3166-1 alpha-2 (e.g., "PT", "ES")
  geo?: { lat?: number; lng?: number };
  images?: string[];
  photoUrl?: string;
  currency?: string;
  buildingGfaSqm?: number;
  starRating?: number;
  propertyType?: string;
  currency?: string;
  buildingGfaSqm?: number;
  starRating?: number;
  propertyType?: string;
  purchasePrice?: number; // total acquisition / capex to-date for template previews
  rooms: RoomTypeItem[];
  facilities: FacilityKey[];
  /** Canonical: total acquisition/CapEx-to-date */
  purchasePrice?: number;
  /** @deprecated legacy alias — DO NOT use; only mapped into purchasePrice by normalizers */
  price?: number;
  createdAt: string;
  updatedAt: string;
};