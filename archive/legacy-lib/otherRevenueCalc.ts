import { OtherRevenueState, OtherRevenueResults } from '../types/otherRevenue';

export type RoomsData = {
  totalRoomsRevenue: number;
  roomsAvailableYearTotal: number;
};

export function calculateOtherRevenue(
  state: OtherRevenueState, 
  roomsData: RoomsData
): OtherRevenueResults {
  // Spa Revenue = TreatmentsPerDay × 365 × AvgPrice
  const spaRevenue = state.spa.treatmentsPerDay * 365 * state.spa.avgPricePerTreatment;
  
  // Other Revenue calculation based on mode
  let otherRevenue = 0;
  if (state.other.mode === "percentage") {
    otherRevenue = roomsData.totalRoomsRevenue * (state.other.percentageOfRooms / 100);
  } else {
    otherRevenue = state.other.monthlyFixed * 12;
  }
  
  const totalAncillary = spaRevenue + otherRevenue;
  const ancillaryRevPAR = roomsData.roomsAvailableYearTotal > 0 
    ? totalAncillary / roomsData.roomsAvailableYearTotal 
    : 0;
  
  return {
    spaRevenue,
    otherRevenue,
    totalAncillary,
    ancillaryRevPAR
  };
}