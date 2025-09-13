import { UWStep } from "../types/underwriting";

export const underwritingSteps: UWStep[] = [
  { id: "introduction",      title: "Introduction",       group: "Deal Setup" },
  { id: "propertyDetails",  title: "Property Details",  group: "Deal Setup" },
  { id: "investmentBudget", title: "Investment Budget", group: "Deal Setup" },
  { id: "roomRevenue",      title: "Room Revenue",      group: "Revenue Modeling" },
  { id: "fbRevenue",        title: "F&B Revenue",       group: "Revenue Modeling" },
  { id: "otherRevenue",     title: "Other Revenue",     group: "Revenue Modeling" },
  { id: "operatingCosts",   title: "Operating Costs",   group: "Cost Structure" },
  { id: "payrollModel",     title: "Payroll Model",     group: "Cost Structure" },
  { id: "rampSettings",     title: "Ramp & Macro",      group: "Cost Structure" },
  { id: "financingStructure", title: "Financing Structure", group: "Financing & Exit" },
  { id: "exitStrategy",     title: "Exit Strategy",     group: "Financing & Exit" },
  { id: "financialResults", title: "Financial Results", group: "Analysis & Reporting" },
  { id: "cashFlow",         title: "Cash Flow",         group: "Analysis & Reporting" },
];