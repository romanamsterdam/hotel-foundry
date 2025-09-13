export type UWSectionId =
  | "introduction"
  | "propertyDetails"
  | "investmentBudget"
  | "roomRevenue"
  | "fbRevenue"
  | "otherRevenue"
  | "operatingCosts"
  | "payrollModel"
  | "rampSettings"
  | "financingStructure"
  | "exitStrategy";
  | "financialResults"
  | "cashFlow";

export type UWStep = {
  id: UWSectionId;
  title: string;
  group: "Deal Setup" | "Revenue Modeling" | "Cost Structure" | "Financing & Exit" | "Analysis & Reporting";
  completed?: boolean; // stored per-deal
};

export type UWProgress = Record<UWSectionId, { completed: boolean }>;