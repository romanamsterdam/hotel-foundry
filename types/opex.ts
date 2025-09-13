export type Driver =
  | "PCT_ROOMS_REVENUE"
  | "PCT_FNB_REVENUE"
  | "PCT_OTHER_REVENUE"
  | "PCT_TOTAL_REVENUE"
  | "PER_ROOM_NIGHT_SOLD"
  | "FIXED_PER_MONTH";

export type OpexItem = {
  id: string;
  label: string;
  value: number;          // numeric input
  unit: "€" | "%" ;
  driver: Driver;         // LOCKED (non-editable for now)
  tooltip?: string;       // "what's included"
  benchmark?: { target: number; min?: number; max?: number; unit: "%" | "€" };
  section: "DIRECT" | "INDIRECT" | "OTHER";
};

export type OpexState = {
  items: OpexItem[];
};

export type OpexResults = {
  directTotal: number;
  indirectTotal: number;
  otherTotal: number;
  grandTotal: number;
  byItem: Record<string, number>;
  bySection: {
    DIRECT: number;
    INDIRECT: number;
    OTHER: number;
  };
};