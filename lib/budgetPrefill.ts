import { Deal, DealBudget } from "../types/deal";
import { getTotalRooms } from "./rooms";

export type PrefillInputs = {
  rooms: number;
  gfaSqm: number;
  purchasePrice: number;
  starRating?: number;      // 1..5
  propertyType?: string;    // "Economy" | "Midscale" | "Upscale" | "Luxury" | "Boutique"
};

export function classMultiplier(star?: number, type?: string) {
  // Light touch multipliers; tune later or move to DB
  if (type?.toLowerCase() === "luxury" || (star ?? 0) >= 5) return 1.3;
  if ((star ?? 0) <= 2 || type?.toLowerCase() === "economy") return 0.85;
  if (type?.toLowerCase() === "boutique") return 1.1;
  return 1.0; // midscale/upscale default
}

export function prefillBudgetMid(inputs: PrefillInputs): DealBudget {
  const { rooms, gfaSqm, purchasePrice, starRating, propertyType } = inputs;
  const mult = classMultiplier(starRating, propertyType);

  // --- Mid benchmarks (can move to DB later) ---
  const CONSTR_PER_SQM_MID = 2000 * mult;
  const FF_E_PER_ROOM_MID  = 12500 * mult;
  const PROF_FEES_PCT_MID  = 10;   // of construction subtotal
  const PLAN_PCT           = 2;    // of construction subtotal
  const DEV_FEE_PCT        = 3;    // of construction subtotal
  const INS_ADMIN_PCT      = 1;    // of construction subtotal
  const OTHER_DEV_PCT      = 1;    // of construction subtotal
  const PREOPEN_PER_ROOM   = 3000 * mult;
  const CONTINGENCY_PCT    = 10;   // of total (sections 1–5)
  const RETT_PCT           = 8;    // of purchase price (generic)
  const DEAL_COSTS_PCT     = 1.5;  // of purchase price

  const netPurchasePrice = purchasePrice;
  const reTransferTax    = (RETT_PCT/100) * netPurchasePrice;
  const dealCosts        = (DEAL_COSTS_PCT/100) * netPurchasePrice;
  const siteAcquisition  = netPurchasePrice + reTransferTax + dealCosts;

  const constructionCosts = gfaSqm > 0 ? CONSTR_PER_SQM_MID * gfaSqm : 0;
  const ffeOse            = rooms > 0  ? FF_E_PER_ROOM_MID * rooms   : 0;
  const constructionSubtotal = constructionCosts + ffeOse;

  const professionalFees  = (PROF_FEES_PCT_MID/100) * constructionSubtotal;
  const planningCharges   = (PLAN_PCT/100) * constructionSubtotal;
  const developmentFee    = (DEV_FEE_PCT/100) * constructionSubtotal;
  const developmentSubtotal = professionalFees + planningCharges + developmentFee;

  const insuranceAdmin    = (INS_ADMIN_PCT/100) * constructionSubtotal;
  const otherDev          = (OTHER_DEV_PCT/100) * constructionSubtotal;
  const otherDevSubtotal  = insuranceAdmin + otherDev;

  const preOpening        = rooms > 0 ? PREOPEN_PER_ROOM * rooms : 0;
  const preOpeningSubtotal = preOpening;

  const contingencyBase   = siteAcquisition + constructionSubtotal + developmentSubtotal + otherDevSubtotal + preOpeningSubtotal;
  const contingencyPct    = CONTINGENCY_PCT;
  const contingencyAmount = (contingencyPct/100) * contingencyBase;

  const grandTotal        = contingencyBase + contingencyAmount;

  return {
    netPurchasePrice, reTransferTax, dealCosts, siteAcquisition,
    constructionCosts, ffeOse, constructionSubtotal,
    professionalFees, planningCharges, developmentFee, developmentSubtotal,
    insuranceAdmin, otherDev, otherDevSubtotal,
    preOpening, preOpeningSubtotal,
    contingencyPct, contingencyAmount,
    grandTotal,
    presetSelections: {
      constructionPerSqm: "mid",
      ffePerRoom: "mid",
      profFeesPct: "mid",
      contingencyPct: "mid",
    },
    assumptionSource: "HF Baseline v1",
  };
}