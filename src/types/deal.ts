export type CurrencyCode = "EUR" | "GBP" | "USD";

import { RoomTypeItem, FacilityKey } from '../lib/types/property';

export type Amenities = {
  spa: boolean; 
  pool: boolean; 
  restaurant: boolean; 
  bar: boolean;
  gym: boolean; 
  meetingsEvents: boolean; 
  parking: boolean; 
  roomService: boolean;
};

export type RoomType = {
  id: string;
  name: string;
  rooms: number;       // integer >= 0
  adrWeight: number;   // index %, e.g. 100 = base, 140 = +40%, 80 = -20%
};
import { FnBState } from '../types/fnb';
import { OtherRevenueState } from '../types/otherRevenue';
import { OpexState } from '../types/opex';
import { PayrollState } from '../types/payroll';

export type Deal = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  location: string;          // e.g. "Ibiza, Spain"
  address: string;
  propertyType: "Economy" | "Midscale" | "Upscale" | "Luxury" | "Boutique";
  stars: 1|2|3|4|5;
  gfaSqm: number;
  purchasePrice: number;
  currency: CurrencyCode;
  roomTypes: RoomType[];     // max 5
  rooms?: Array<{ id?: string; type: string; count: number; sqm?: number; adrBase?: number }>; // normalized room data
  facilities?: string[];     // normalized facility names
  normalizedRooms?: RoomTypeItem[];  // new unified format
  normalizedFacilities?: FacilityKey[];  // new unified format
  amenities: Amenities;
  photoUrl?: string;
  budget?: DealBudget;
  roomRevenue?: RoomRevenueModel;
  fnbRevenue?: FnBState;
  otherRevenue?: OtherRevenueState;
  operatingExpenses?: OpexState;
  payrollModel?: PayrollState;
  assumptions?: Record<string, unknown> & {
    rampSettings?: import('./ramp').RampSettings;
    financingSettings?: import('./financing').FinancingSettings;
    exitSettings?: import('./exitStrategy').ExitSettings;
  };
};

export type DealBudget = {
  // 1 Site Acquisition
  netPurchasePrice: number;    // 1.1 (loads from deal.purchasePrice; edits here overwrite deal.purchasePrice)
  reTransferTax: number;       // 1.2
  dealCosts: number;           // 1.3
  siteAcquisition: number;     // computed

  // 2 Construction Costs
  constructionCosts: number;   // 2.1
  ffeOse: number;              // 2.2
  constructionSubtotal: number;// computed

  // 3 Development Costs
  professionalFees: number;    // 3.1
  planningCharges: number;     // 3.2
  developmentFee: number;      // 3.3
  developmentSubtotal: number; // computed

  // 4 Other Development Costs
  insuranceAdmin: number;      // 4.1
  otherDev: number;            // 4.2
  otherDevSubtotal: number;    // computed

  // 5 Pre-opening
  preOpening: number;          // 5.1
  preOpeningSubtotal: number;  // computed

  // 6 Contingency
  contingencyPct: number;      // 6.1 (% input)
  contingencyAmount: number;   // 6 (computed)

  // GRAND TOTAL excl. VAT
  grandTotal: number;          // computed

  // Optional traceability fields
  presetSelections?: {
    constructionPerSqm?: "low" | "mid" | "high" | "custom";
    ffePerRoom?: "low" | "mid" | "high" | "custom";
    profFeesPct?: "low" | "mid" | "high" | "custom";
    contingencyPct?: "low" | "mid" | "high" | "custom";
  };
  assumptionSource?: string; // e.g., "HF Baseline v1"
};

export type MonthRow = {
  month: number;               // 1..12
  adr: number;                 // € per room-night
  occPct: number;              // 0..100
  revpar: number;              // computed = adr * (occPct/100)
  days: number;                // computed
  roomsAvailable: number;      // rooms * days
  roomsSold: number;           // roomsAvailable * occPct/100
  roomsRevenue: number;        // roomsSold * adr
};

export type RoomRevenueModel = {
  seasonalityPreset?: "beach" | "winterResort" | "majorCity" | "businessCity" | "custom";
  months: MonthRow[];          // length 12
  totals: {
    roomsAvailable: number;
    roomsSold: number;
    roomsRevenue: number;
    // KPI roll-ups (derived, not averaged):
    avgADR: number;            // Total Rooms Revenue / Total Rooms Sold
    avgOccPct: number;         // Total Rooms Sold / Total Rooms Available * 100
    avgRevPAR: number;         // avgADR * (avgOccPct/100)
  };
  currency: string;
};