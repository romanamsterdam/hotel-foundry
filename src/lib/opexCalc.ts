import { OpexState, OpexItem, OpexResults, Driver } from '../types/opex';

export type RevenueData = {
  totalRoomsRevenue: number;
  totalFnbRevenue: number;
  totalOtherRevenue: number;
  totalRevenue: number;
  roomsSoldByMonth: number[];
  roomsSoldYearTotal: number;
};

export function calculateOpexItem(
  item: OpexItem, 
  revenueData: RevenueData
): number {
  const { value, driver } = item;
  const { 
    totalRoomsRevenue, 
    totalFnbRevenue, 
    totalOtherRevenue, 
    totalRevenue, 
    roomsSoldYearTotal 
  } = revenueData;

  switch (driver) {
    case "PCT_ROOMS_REVENUE":
      return (value / 100) * totalRoomsRevenue;
    case "PCT_FNB_REVENUE":
      return (value / 100) * totalFnbRevenue;
    case "PCT_OTHER_REVENUE":
      return (value / 100) * totalOtherRevenue;
    case "PCT_TOTAL_REVENUE":
      return (value / 100) * totalRevenue;
    case "PER_ROOM_NIGHT_SOLD":
      return value * roomsSoldYearTotal;
    case "FIXED_PER_MONTH":
      return value * 12;
    default:
      return 0;
  }
}

export function calculateOpexResults(
  state: OpexState, 
  revenueData: RevenueData
): OpexResults {
  const byItem: Record<string, number> = {};
  const bySection = { DIRECT: 0, INDIRECT: 0, OTHER: 0 };

  state.items.forEach(item => {
    const amount = calculateOpexItem(item, revenueData);
    byItem[item.id] = amount;
    bySection[item.section] += amount;
  });

  const directTotal = bySection.DIRECT;
  const indirectTotal = bySection.INDIRECT;
  const otherTotal = bySection.OTHER;
  const grandTotal = directTotal + indirectTotal + otherTotal;

  return {
    directTotal,
    indirectTotal,
    otherTotal,
    grandTotal,
    byItem,
    bySection
  };
}

export function getDriverLabel(driver: Driver): string {
  switch (driver) {
    case "PCT_ROOMS_REVENUE":
      return "% of Rooms Revenue";
    case "PCT_FNB_REVENUE":
      return "% of F&B Revenue";
    case "PCT_OTHER_REVENUE":
      return "% of Other Revenue";
    case "PCT_TOTAL_REVENUE":
      return "% of Total Revenue";
    case "PER_ROOM_NIGHT_SOLD":
      return "€ per Room Night Sold";
    case "FIXED_PER_MONTH":
      return "€ Fixed per Month";
    default:
      return "Unknown";
  }
}