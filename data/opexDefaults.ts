import { OpexState, OpexItem } from '../types/opex';

export function createDefaultOpexState(): OpexState {
  const items: OpexItem[] = [
    // DIRECT COSTS
    {
      id: "rooms-commission",
      label: "Rooms Commission",
      value: 15,
      unit: "%",
      driver: "PCT_ROOMS_REVENUE",
      tooltip: "OTA/TA commissions and distribution fees.",
      benchmark: { target: 15, min: 12, max: 18, unit: "%" },
      section: "DIRECT"
    },
    {
      id: "guest-supplies-cleaning",
      label: "Guest Supplies, Cleaning",
      value: 8,
      unit: "€",
      driver: "PER_ROOM_NIGHT_SOLD",
      tooltip: "Linen, amenities, cleaning consumables.",
      benchmark: { target: 8, min: 6, max: 10, unit: "€" },
      section: "DIRECT"
    },
    {
      id: "cost-of-goods-sold",
      label: "Cost of Goods Sold",
      value: 30,
      unit: "%",
      driver: "PCT_FNB_REVENUE",
      tooltip: "F&B COGS (food & beverage inputs).",
      benchmark: { target: 30, min: 25, max: 35, unit: "%" },
      section: "DIRECT"
    },
    {
      id: "me-costs",
      label: "M&E Costs (Meeting & Events)",
      value: 2,
      unit: "%",
      driver: "PCT_OTHER_REVENUE",
      tooltip: "Event production & variable M&E costs.",
      section: "DIRECT"
    },
    {
      id: "wellness-other-costs",
      label: "Wellness Other Costs",
      value: 1500,
      unit: "€",
      driver: "FIXED_PER_MONTH",
      tooltip: "Non‑payroll spa supplies & licenses.",
      section: "DIRECT"
    },
    {
      id: "other-direct-costs",
      label: "Other Direct Costs",
      value: 2000,
      unit: "€",
      driver: "FIXED_PER_MONTH",
      tooltip: "Misc. direct operating expenses.",
      section: "DIRECT"
    },

    // INDIRECT COSTS
    {
      id: "other-ag",
      label: "Other A&G",
      value: 2,
      unit: "%",
      driver: "PCT_TOTAL_REVENUE",
      tooltip: "General admin & overhead (non‑payroll).",
      benchmark: { target: 2, min: 1.5, max: 3, unit: "%" },
      section: "INDIRECT"
    },
    {
      id: "tech-subscriptions",
      label: "Tech Subscriptions",
      value: 800,
      unit: "€",
      driver: "FIXED_PER_MONTH",
      tooltip: "PMS, channel manager, RMS, analytics.",
      section: "INDIRECT"
    },
    {
      id: "other-sm",
      label: "Other S&M",
      value: 3,
      unit: "%",
      driver: "PCT_TOTAL_REVENUE",
      tooltip: "Marketing, PR, non‑payroll sales costs.",
      benchmark: { target: 3, min: 2, max: 4, unit: "%" },
      section: "INDIRECT"
    },
    {
      id: "maintenance-other",
      label: "Maintenance Other",
      value: 2,
      unit: "%",
      driver: "PCT_TOTAL_REVENUE",
      tooltip: "Repairs, supplies, compliance (non‑payroll).",
      benchmark: { target: 2, min: 1, max: 3, unit: "%" },
      section: "INDIRECT"
    },
    {
      id: "utilities",
      label: "Utilities",
      value: 3,
      unit: "%",
      driver: "PCT_TOTAL_REVENUE",
      tooltip: "Electricity, water, gas, internet.",
      benchmark: { target: 3, min: 2, max: 4, unit: "%" },
      section: "INDIRECT"
    },

    // OTHER COSTS
    {
      id: "management-fees",
      label: "Management Fees",
      value: 3,
      unit: "%",
      driver: "PCT_TOTAL_REVENUE",
      tooltip: "Base operator/asset management fee (ex‑incentives).",
      section: "OTHER"
    },
    {
      id: "property-taxes",
      label: "Property Taxes",
      value: 1,
      unit: "%",
      driver: "PCT_TOTAL_REVENUE",
      tooltip: "Local property/municipal taxes & fees.",
      benchmark: { target: 1, min: 0.5, max: 1.5, unit: "%" },
      section: "OTHER"
    },
    {
      id: "insurance",
      label: "Insurance",
      value: 1,
      unit: "%",
      driver: "PCT_TOTAL_REVENUE",
      tooltip: "Property & liability insurance.",
      benchmark: { target: 1, min: 0.8, max: 1.5, unit: "%" },
      section: "OTHER"
    },
    {
      id: "rent",
      label: "Rent",
      value: 0,
      unit: "€",
      driver: "FIXED_PER_MONTH",
      tooltip: "Ground lease/base rent (if any).",
      section: "OTHER"
    }
  ];

  return { items };
}