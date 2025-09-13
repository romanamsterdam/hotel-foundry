import { getRoomsKpisByYear } from "./roomsComputed";
import type { Series, YearKey } from "./roomsComputed";

export { Series, YearKey };

export function selectAdrByYear(dealId: string): Series {
  return getRoomsKpisByYear(dealId).adrByYear;
}

export function selectOccByYear(dealId: string): Series {
  return getRoomsKpisByYear(dealId).occByYear;
}

export function selectRevParByYear(dealId: string): Series {
  return getRoomsKpisByYear(dealId).revparByYear;
}

export function selectRoomsAvailableByYear(dealId: string): Series {
  return getRoomsKpisByYear(dealId).roomsAvailableByYear;
}

export function selectRoomsSoldByYear(dealId: string): Series {
  return getRoomsKpisByYear(dealId).roomsSoldByYear;
}