import { Deal } from "../types/deal";
import { getTotalRooms } from "./rooms";

export function weightedADR(deal: Deal, overallAdr = 150) {
  // If overall ADR isn't set yet, use a placeholder (150) just for illustrative KPI
  const rooms = getTotalRooms(deal) || 1;
  const wAdrSum = deal.roomTypes.reduce((s, rt) => s + (overallAdr * (rt.adrWeight/100)) * (rt.rooms||0), 0);
  return wAdrSum / rooms;
}

export function revpar(adr: number, occ = 0.70) {
  return adr * occ; // simple RevPAR
}

export function roomsMix(deal: Deal) {
  const total = getTotalRooms(deal) || 1;
  return deal.roomTypes.map(rt => ({
    name: rt.name, rooms: rt.rooms, share: (rt.rooms/total)
  }));
}

export function budgetStatus(deal: Deal) {
  const purchasePriceEntered = typeof deal.purchasePrice === "number" && deal.purchasePrice > 0;
  return { purchasePriceEntered, value: deal.purchasePrice || 0 };
}