export type OtherRevenueMode = "percentage" | "fixed";

export type OtherRevenueState = {
  spa: {
    treatmentsPerDay: number;
    avgPricePerTreatment: number;
  };
  other: {
    mode: OtherRevenueMode;
    percentageOfRooms: number;  // 0-100
    monthlyFixed: number;       // €
  };
};

export type OtherRevenueResults = {
  spaRevenue: number;
  otherRevenue: number;
  totalAncillary: number;
  ancillaryRevPAR: number;
};