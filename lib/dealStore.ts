import { Deal } from "../types/deal";
import { normalizeFacilities, normalizeRoomTypes, normalizeLocation, Facility } from "./deals/normalizers";

const KEY = "hf_deals_v1";

export function listDeals(): Deal[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Deal[]) : [];
}

export function saveDeals(deals: Deal[]) {
  localStorage.setItem(KEY, JSON.stringify(deals));
}

export function upsertDeal(deal: Deal) {
  // Normalize data through canonical functions to prevent duplicates
  const facilitiesArray = Array.isArray(deal.facilities) ? deal.facilities : [];
  const normalizedFacilities = normalizeFacilities(facilitiesArray);
  
  const updatedDeal: Deal = {
    ...deal,
    facilities: normalizedFacilities.map(f => f.label), // Keep as string array for backward compatibility
    normalizedRooms: normalizeRoomTypes(deal.normalizedRooms || deal.rooms?.map(r => ({
      id: r.id || crypto.randomUUID(),
      name: r.type,
      count: r.count,
      sqm: r.sqm,
      adrBase: r.adrBase
    }))),
    location: normalizeLocation(deal),
    updatedAt: new Date().toISOString()
  };
  const all = listDeals();
  const i = all.findIndex(d => d.id === updatedDeal.id);
  if (i >= 0) all[i] = updatedDeal; else all.unshift(updatedDeal);
  saveDeals(all);
}

export function removeDeal(id: string) {
  saveDeals(listDeals().filter(d => d.id !== id));
}

export function getDeal(id: string): Deal | undefined {
  return listDeals().find(d => d.id === id);
}

export function newId() {
  return crypto.randomUUID();
}