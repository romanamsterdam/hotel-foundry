export type RoomBreakdownItem = { type: string; count: number };
export type Facility = 'Pool'|'Restaurant'|'Bar'|'Parking'|'Spa'|'Beach'|'Gym'|'Conference'|'RoomService'|'Other';

export interface PropertyTemplate {
  id: string;            // uuid
  slug: string;          // derived from name
  dealName: string;
  city: string;
  country: string;
  fullAddress?: string;
  photoUrl?: string;
  propertyType: 'Boutique Hotel'|'Resort'|'City Hotel'|'Hostel'|'Other';
  featured: boolean;
  stars: 1|2|3|4|5;
  currency: 'EUR'|'USD'|'PHP'|'GBP'|'Other';
  gfaSqm?: number;
  purchasePrice?: number;
  roomsTotal: number;
  roomBreakdown: RoomBreakdownItem[];
  facilities: Facility[];
  showInTemplates: boolean; // admin toggle
  showInGallery: boolean;   // admin toggle
  createdAt: string;
  updatedAt: string;
}

export type FacilityTag = 'Pool' | 'Restaurant' | 'Bar' | 'Spa' | 'Parking' | 'Gym' | 'Beach' | 'Conference' | 'RoomService' | 'Other';

export type RoomType = {
  id: string;             // uuid
  name: string;           // e.g., Deluxe, Suite
  count: number;          // rooms of this type
  baseAdr?: number;       // optional seed ADR
  baseOcc?: number;       // 0..1 optional seed occupancy
};

export type PropertyCore = {
  name: string;
  location: string;
  address?: string;
  photoUrl?: string;
  propertyType: 'Boutique' | 'Resort' | 'City' | 'Hostel' | 'Other';
  starRating: number;                 // 1..5
  currency: 'EUR' | 'USD' | 'GBP';    // extend later
  gfaSqm?: number;
  purchasePrice?: number;
  facilities: FacilityTag[];
  roomTypes: RoomType[];              // <-- IMPORTANT
  totalRooms: number;                 // derived, read-only
};

export type SampleProperty = PropertyCore & {
  id: string;
  status: 'draft' | 'published';
  tags?: string[];
  guidePrice?: number;
  createdAt: string;
  updatedAt: string;
};

// Legacy compatibility
export interface Property {
  id: string;
  name: string;
  country: string;
  region?: string;
  address?: string;
  roomsTotal: number;
  roomTypes?: { name: string; count: number; }[];
  gfaSqm?: number;
  guidePriceEUR: number; // This is the purchasePrice from CatalogProperty
  stars?: 1 | 2 | 3 | 4 | 5;
  facilities: FacilityKey[]; // Changed to FacilityKey[]
  images: string[];
  adrSample?: number;
  occupancySample?: number;
  propertyType: string;
  description?: string;
}