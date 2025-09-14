import { RoomType } from "../types/deal";
import { computeTotalRooms } from "./deals/normalizers";
import { RoomTypeItem } from "./types/property";

export function totalRooms(types: RoomType[]) {
  return types.reduce((s, r) => s + (Number(r.rooms) || 0), 0);
}

// Enhanced version that works with both legacy and normalized room data
export function getTotalRooms(deal: any): number {
  // Try new unified format first (prioritize normalizedRooms)
  if (Array.isArray(deal?.normalizedRooms) && deal.normalizedRooms.length > 0) {
    return computeTotalRooms(deal.normalizedRooms);
  }
  // Try normalized rooms format
  if (Array.isArray(deal?.rooms) && deal.rooms.length > 0) {
    return computeTotalRooms(deal.rooms.map((r: any) => ({ ...r, count: r.count })));
  }
  // Fallback to legacy roomTypes
  if (Array.isArray(deal?.roomTypes) && deal.roomTypes.length > 0) {
    return totalRooms(deal.roomTypes);
  }
  return 0;
}
// ADR for a type given overall ADR and weight index
export function adrByType(overallAdr: number, weightIndex: number) {
  return overallAdr * (weightIndex / 100);
}