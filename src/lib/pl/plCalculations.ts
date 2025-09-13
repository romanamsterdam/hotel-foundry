import { Deal } from '../../types/deal';
import { getDeal } from '../dealStore';
import { getTotalRooms } from '../rooms';
import { computeAdvancedAnnual } from '../fnbCalc';
import { calculateOtherRevenue } from '../otherRevenueCalc';
import { calculateOpexResults } from '../opexCalc';
import { calcAdvanced } from '../payrollCalc';
import { buildDebtSchedule } from '../debt';
import { getRoomsKpisByYear } from '../finance/roomsComputed';
import { ratioWithCostRamp } from '../finance/ratios';
import { 
  selectCostRampByYear, 
  selectExitYearIndex, 
  selectToplineGrowthRateByYear, 
  selectInflationRateByYear,
  selectToplineRampByYear 
} from '../finance/rampMacroSelectors';
import { yearsThrough, YearKey, Series, buildIndexFromRates } from '../finance/factors';
import { toFraction } from '../finance/units';

// Helper function to safely get opex values from deal.operatingExpenses
function getOpexValue(deal: Deal, itemId: string): number {
  if (!deal.operatingExpenses?.items) return 0;
  const item = deal.operatingExpenses.items.find(item => item.id === itemId);
  return item?.value || 0;
}

export function applyPLHorizon(
  rows: PLRow[], 
  horizon: number, 
  totalRevenueByYear: number[],
  roomsSoldByYear: number[], 
  roomsCountByYear: number[]
): PLRow[] {
  const H = Math.max(0, Math.min(10, horizon ?? 10));
  return rows.map((r) => ({
    ...r,
    years: (r.years ?? []).map((cell, idx) => {
      const yearNo = idx + 1;
      if (yearNo > H) return { year: yearNo, total: 0, pctOfTR: 0, por: 0, par: 0 };
      const total = cell?.total ?? 0;
      const tr = totalRevenueByYear[idx] ?? 0;
      const rs = roomsSoldByYear[idx] ?? 0;
      const rc = roomsCountByYear[idx] ?? 0;
      return {
        year: yearNo,
        total,
        pctOfTR: tr > 0 ? (total / tr) * 100 : 0,
        por: rs > 0 ? total / rs : 0,
        par: rc > 0 ? total / rc : 0, // Per Room (key) - divide by rooms count, not room-nights
      };
    }),
  }));
}

function getExitYear(deal: Deal): number | null {
  const exitSettings = deal.assumptions?.exitSettings;
  if (!exitSettings) return null;
  
  if (exitSettings.strategy === "SALE") {
    return exitSettings.sale.exitYear;
  } else if (exitSettings.strategy === "REFINANCE") {
    return exitSettings.refinance.refinanceYear;
  }
  
  return null; // Hold forever
}

export type PLYearData = {
  year: number;
  total: number;
  pctOfTR?: number;
  por?: number;
  par?: number;
};

export type PLRow = {
  id: string;
  label: string;
  group: 'KPIS' | 'REVENUE' | 'DIRECT' | 'UNDISTRIBUTED' | 'FIXED' | 'SUMMARY';
  type: 'kpi' | 'line' | 'subtotal' | 'total' | 'section';
  years: PLYearData[];
};

export function calculatePLData(dealId: string, yearCount: number = 10): PLRow[] {
  const deal = getDeal(dealId);
  if (!deal) {
    return [];
  }

  const rooms = getTotalRooms(deal);
  const exitYear = getExitYear(deal);
  const horizon = exitYear ?? 10;
  
  // Get all years up to exit
  const allYears: YearKey[] = ["y0","y1","y2","y3","y4","y5","y6","y7","y8","y9","y10"];
  const years = yearsThrough(allYears, horizon);
  const yearArray = years.filter(y => Number(y.slice(1)) > 0).map(y => Number(y.slice(1))); // [1,2,3,...]
  
  // Build indices and ramps
  const growthRates = selectToplineGrowthRateByYear(dealId);
  const inflationRates = selectInflationRateByYear(dealId);
  const growthIndex = buildIndexFromRates(growthRates, allYears, 1, 1); // growth only
  const inflationIndex = buildIndexFromRates(inflationRates, allYears, 1, 1); // inflation only
  const toplineRamp = selectToplineRampByYear(dealId);
  const costRamp = selectCostRampByYear(dealId);
  
  // Use standardized rooms KPIs computation (high precision) 
  const roomsKpis = getRoomsKpisByYear(dealId);
  
  // Extract high-precision KPI arrays
  const adrByYear = yearArray.map(year => roomsKpis.adrByYear[`y${year}`] || 0);
  const occupancyByYear = yearArray.map(year => (roomsKpis.occByYear[`y${year}`] || 0) * 100); // Convert to percentage for display
  const revparByYear = yearArray.map(year => roomsKpis.revparByYear[`y${year}`] || 0);
  const roomsAvailableByYear = yearArray.map(year => roomsKpis.roomsAvailableByYear[`y${year}`] || 0);
  const roomsSoldByYear = yearArray.map(year => roomsKpis.roomsSoldByYear[`y${year}`] || 0);
  
  // Calculate rooms revenue from high-precision KPIs (NO EARLY ROUNDING)
  const roomsRevenueByYear = yearArray.map(year => {
    const adr = roomsKpis.adrByYear[`y${year}`] || 0;
    const roomsSold = roomsKpis.roomsSoldByYear[`y${year}`] || 0;
    return adr * roomsSold; // High precision calculation
  });

  // ===== F&B Revenue =====
  let fnbRevenueByYear = Array(yearArray.length).fill(0);
  if (deal.fnbRevenue && deal.roomRevenue) {
    const roomsSelectors = {
      roomsAvailableByMonth: deal.roomRevenue.months.map(m => m.roomsAvailable),
      roomsSoldByMonth: deal.roomRevenue.months.map(m => m.roomsSold),
      roomsAvailableYearTotal: deal.roomRevenue.totals.roomsAvailable,
      roomsSoldYearTotal: deal.roomRevenue.totals.roomsSold
    };
    const fnbResults = computeAdvancedAnnual(deal.fnbRevenue, roomsSelectors);
    const stabilizedFnbRevenue = fnbResults.totalFnb;
    
    // Apply ramp and growth (NO INFLATION for revenue)
    fnbRevenueByYear = yearArray.map(year => {
      const yearKey = `y${year}` as YearKey;
      const rampMultiplier = toplineRamp[yearKey] || 1;
      const growthMultiplier = growthIndex[yearKey] || 1;
      return stabilizedFnbRevenue * rampMultiplier * growthMultiplier;
    });
  }
  
  // ===== Spa Revenue =====
  let spaRevenueByYear = Array(yearArray.length).fill(0);
  // ===== Other Operating Revenue =====
  let otherOperatingRevenueByYear = Array(yearArray.length).fill(0);
  
  if (deal.otherRevenue && deal.roomRevenue) {
    const roomsData = {
      totalRoomsRevenue: deal.roomRevenue.totals.roomsRevenue,
      roomsAvailableYearTotal: deal.roomRevenue.totals.roomsAvailable
    };
    const otherResults = calculateOtherRevenue(deal.otherRevenue, roomsData);
    const stabilizedSpaRevenue = otherResults.spaRevenue;
    const stabilizedOtherRevenue = otherResults.otherRevenue;
    
    // Spa Revenue: treatments/day × 365 × avg price × topline ramp × growth
    spaRevenueByYear = yearArray.map(year => {
      const yearKey = `y${year}` as YearKey;
      const rampMultiplier = toplineRamp[yearKey] || 1;
      const growthMultiplier = growthIndex[yearKey] || 1;
      return stabilizedSpaRevenue * rampMultiplier * growthMultiplier;
    });
    
    // Other Operating Revenue: % of rooms revenue OR monthly×12×topline ramp (no growth)
    otherOperatingRevenueByYear = yearArray.map(year => {
      const yearKey = `y${year}` as YearKey;
      if (deal.otherRevenue!.other.mode === "percentage") {
        // % of rooms revenue (already contains ramp+growth)
        const pct = deal.otherRevenue!.other.percentageOfRooms / 100;
        return roomsRevenueByYear[year - 1] * pct;
      } else {
        // Monthly fixed × 12 × topline ramp (no growth)
        const rampMultiplier = toplineRamp[yearKey] || 1;
        return deal.otherRevenue!.other.monthlyFixed * 12 * rampMultiplier;
      }
    });
  }

  const totalRevenueByYear = yearArray.map((_, i) => 
    roomsRevenueByYear[i] + fnbRevenueByYear[i] + spaRevenueByYear[i] + otherOperatingRevenueByYear[i]
  );

  // Calculate Payroll by Department
  let payrollByDept = {
    rooms: Array(yearArray.length).fill(0),
    fnb: Array(yearArray.length).fill(0),
    wellness: Array(yearArray.length).fill(0),
    ag: Array(yearArray.length).fill(0),
    sales: Array(yearArray.length).fill(0),
    maintenance: Array(yearArray.length).fill(0)
  };
  
  if (deal.payrollModel) {
    try {
      const payrollResults = calcAdvanced(deal.payrollModel.advanced, rooms);
    
      // Apply cost ramp and inflation to each department (payroll = EUR costs)
      Object.keys(payrollByDept).forEach(dept => {
        const stabilizedAmount = payrollResults.byDepartment[dept as keyof typeof payrollResults.byDepartment].total;
        payrollByDept[dept as keyof typeof payrollByDept] = yearArray.map(year => {
          const yearKey = `y${year}` as YearKey;
          const rampMultiplier = costRamp[yearKey] || 1;
          const inflationMultiplier = inflationIndex[yearKey] || 1;
          return stabilizedAmount * rampMultiplier * inflationMultiplier;
        });
      });
    } catch {
      // Keep default zero arrays
    }
  }

  // Calculate Operating Expenses with Cost Ramp (using dynamic values from Operating Expenses)
  let opexByCategory = {
    roomsCommission: Array(yearArray.length).fill(0),
    guestSupplies: Array(yearArray.length).fill(0),
    cogs: Array(yearArray.length).fill(0),
    otherAG: Array(yearArray.length).fill(0),
    techSubscriptions: Array(yearArray.length).fill(0),
    otherSM: Array(yearArray.length).fill(0),
    maintenanceOther: Array(yearArray.length).fill(0),
    utilities: Array(yearArray.length).fill(0),
    managementFees: Array(yearArray.length).fill(0),
    propertyTaxes: Array(yearArray.length).fill(0),
    insurance: Array(yearArray.length).fill(0),
    meCosts: Array(yearArray.length).fill(0),
    wellnessOtherCosts: Array(yearArray.length).fill(0),
    otherDirectCosts: Array(yearArray.length).fill(0)
  };

  // Calculate each expense category with proper drivers, cost ramp, and inflation
  yearArray.forEach((year, i) => {
    const yearKey = `y${year}` as YearKey;
    const rampMultiplier = costRamp[yearKey] || 1;
    const inflationMultiplier = inflationIndex[yearKey] || 1;
    
    // Revenue-based costs (percentage stays constant, but revenue grows)
    // Use dynamic values from Operating Expenses - percentage costs get cost ramp only
    const roomsCommissionPct = getOpexValue(deal, 'rooms-commission') / 100;
    opexByCategory.roomsCommission[i] = roomsRevenueByYear[i] * roomsCommissionPct * rampMultiplier;
    
    const cogsPct = getOpexValue(deal, 'cost-of-goods-sold') / 100;
    opexByCategory.cogs[i] = fnbRevenueByYear[i] * cogsPct * rampMultiplier;
    
    const otherAGPct = getOpexValue(deal, 'other-ag') / 100;
    opexByCategory.otherAG[i] = totalRevenueByYear[i] * otherAGPct * rampMultiplier;
    
    const otherSMPct = getOpexValue(deal, 'other-sm') / 100;
    opexByCategory.otherSM[i] = totalRevenueByYear[i] * otherSMPct * rampMultiplier;
    
    const maintenanceOtherPct = getOpexValue(deal, 'maintenance-other') / 100;
    opexByCategory.maintenanceOther[i] = totalRevenueByYear[i] * maintenanceOtherPct * rampMultiplier;
    
    const utilitiesPct = getOpexValue(deal, 'utilities') / 100;
    opexByCategory.utilities[i] = totalRevenueByYear[i] * utilitiesPct * rampMultiplier;
    
    const managementFeesPct = getOpexValue(deal, 'management-fees') / 100;
    opexByCategory.managementFees[i] = totalRevenueByYear[i] * managementFeesPct * rampMultiplier;
    
    const propertyTaxesPct = getOpexValue(deal, 'property-taxes') / 100;
    opexByCategory.propertyTaxes[i] = totalRevenueByYear[i] * propertyTaxesPct * rampMultiplier;
    
    const insurancePct = getOpexValue(deal, 'insurance') / 100;
    opexByCategory.insurance[i] = totalRevenueByYear[i] * insurancePct * rampMultiplier;
    
    const meCostsPct = getOpexValue(deal, 'me-costs') / 100;
    opexByCategory.meCosts[i] = (spaRevenueByYear[i] + otherOperatingRevenueByYear[i]) * meCostsPct * rampMultiplier;
    
    // Per-room-night costs (apply cost ramp and inflation - EUR costs)
    const roomsSold = roomsKpis.roomsSoldByYear[yearKey] || 0;
    const guestSuppliesPerRN = getOpexValue(deal, 'guest-supplies-cleaning');
    opexByCategory.guestSupplies[i] = roomsSold * guestSuppliesPerRN * rampMultiplier * inflationMultiplier;
    
    // Fixed monthly costs (apply cost ramp and inflation - EUR costs)
    const techSubscriptionsMonthly = getOpexValue(deal, 'tech-subscriptions');
    opexByCategory.techSubscriptions[i] = techSubscriptionsMonthly * 12 * rampMultiplier * inflationMultiplier;
    
    const wellnessOtherCostsMonthly = getOpexValue(deal, 'wellness-other-costs');
    opexByCategory.wellnessOtherCosts[i] = wellnessOtherCostsMonthly * 12 * rampMultiplier * inflationMultiplier;
    
    const otherDirectCostsMonthly = getOpexValue(deal, 'other-direct-costs');
    opexByCategory.otherDirectCosts[i] = otherDirectCostsMonthly * 12 * rampMultiplier * inflationMultiplier;
  });

  // Get financing data
  const projectCost = deal.budget?.grandTotal || 0;
  const financingSettings = deal.assumptions?.financingSettings;
  let annualDebtService = 0;
  let annualInterest = 0;
  
  if (financingSettings && projectCost > 0) {
    try {
      const debtSchedule = buildDebtSchedule(financingSettings, projectCost);
      annualDebtService = debtSchedule.annualDebtService;
      annualInterest = annualDebtService * 0.8; // Approximate interest portion
    } catch {
      annualDebtService = 0;
      annualInterest = 0;
    }
  }

  // Calculate depreciation
  const rampSettings = deal.assumptions?.rampSettings;
  const depreciationPct = rampSettings?.depreciationPctOfCapex || 3;
  const annualDepreciation = (depreciationPct / 100) * projectCost;

  // Calculate rent (fixed monthly cost with cost ramp and inflation)
  const rentByYear = yearArray.map((year, i) => {
    const yearKey = `y${year}` as YearKey;
    const rampMultiplier = costRamp[yearKey] || 1;
    const inflationMultiplier = inflationIndex[yearKey] || 1;
    const rentMonthly = getOpexValue(deal, 'rent');
    return rentMonthly * 12 * rampMultiplier * inflationMultiplier;
  });

  // Calculate subtotals
  const roomsDirectCostsSubtotal = yearArray.map((_, i) => 
    payrollByDept.rooms[i] + opexByCategory.roomsCommission[i] + opexByCategory.guestSupplies[i]
  );
  
  const fnbDirectCostsSubtotal = yearArray.map((_, i) => 
    payrollByDept.fnb[i] + opexByCategory.cogs[i]
  );
  
  const meDirectCostsSubtotal = yearArray.map((_, i) => 
    opexByCategory.meCosts[i]
  );
  
  const wellnessDirectCostsSubtotal = yearArray.map((_, i) => 
    payrollByDept.wellness[i] + opexByCategory.wellnessOtherCosts[i]
  );
  
  const directCostsTotal = yearArray.map((_, i) => 
    roomsDirectCostsSubtotal[i] + fnbDirectCostsSubtotal[i] + meDirectCostsSubtotal[i] + 
    wellnessDirectCostsSubtotal[i] + opexByCategory.otherDirectCosts[i]
  );
  
  const goiByYear = yearArray.map((_, i) => 
    totalRevenueByYear[i] - directCostsTotal[i]
  );

  const agSubtotal = yearArray.map((_, i) => 
    payrollByDept.ag[i] + opexByCategory.otherAG[i]
  );
  
  const itSubtotal = yearArray.map((_, i) => 
    opexByCategory.techSubscriptions[i]
  );
  
  const smSubtotal = yearArray.map((_, i) => 
    payrollByDept.sales[i] + opexByCategory.otherSM[i]
  );
  
  const pomSubtotal = yearArray.map((_, i) => 
    payrollByDept.maintenance[i] + opexByCategory.maintenanceOther[i]
  );
  
  const indirectCostsTotal = yearArray.map((_, i) => 
    agSubtotal[i] + itSubtotal[i] + smSubtotal[i] + pomSubtotal[i] + opexByCategory.utilities[i]
  );

  const gopByYear = yearArray.map((_, i) => 
    goiByYear[i] - indirectCostsTotal[i]
  );

  const fixedCostsExceptRent = yearArray.map((_, i) => 
    opexByCategory.managementFees[i] + opexByCategory.propertyTaxes[i] + opexByCategory.insurance[i]
  );

  const ebitdarByYear = yearArray.map((_, i) => 
    gopByYear[i] - fixedCostsExceptRent[i]
  );

  const ebitdaByYear = yearArray.map((_, i) => 
    ebitdarByYear[i] - rentByYear[i]
  );

  const netIncomeByYear = yearArray.map((_, i) => 
    ebitdaByYear[i] - annualDepreciation - annualInterest
  );

  // Helper function to create year data with ratios
  const createYearData = (values: number[], totalRevenues: number[], roomsSold: number[], roomsCountByYear: number[]): PLYearData[] => {
    return values.map((value, i) => ({
      year: i + 1,
      total: value,
      pctOfTR: totalRevenues[i] > 0 ? (value / totalRevenues[i]) * 100 : 0,
      por: roomsSold[i] > 0 ? value / roomsSold[i] : 0,
      par: (roomsCountByYear[i] ?? 0) > 0 ? value / (roomsCountByYear[i] ?? 0) : 0
    }));
  };

  // Build per-year rooms count
  const roomsCountByYear: number[] = Array.from({ length: yearArray.length }, () => rooms);

  // Build P&L rows with proper USALI hierarchy
  const rows: PLRow[] = [
    // KPIs
    {
      id: 'rooms-open',
      label: 'Rooms Open',
      group: 'KPIS',
      type: 'kpi',
      years: yearArray.map((year, idx) => ({ year, total: roomsCountByYear[idx], pctOfTR: 0, por: 0, par: 0 }))
    },
    {
      id: 'rooms-available',
      label: 'Rooms Available',
      group: 'KPIS',
      type: 'kpi',
      years: createYearData(roomsAvailableByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'rooms-sold',
      label: 'Rooms Sold',
      group: 'KPIS',
      type: 'kpi',
      years: createYearData(roomsSoldByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'adr',
      label: 'ADR',
      group: 'KPIS',
      type: 'kpi',
      years: createYearData(adrByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'occupancy',
      label: 'Occupancy',
      group: 'KPIS',
      type: 'kpi',
      years: createYearData(occupancyByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'revpar',
      label: 'RevPAR',
      group: 'KPIS',
      type: 'kpi',
      years: createYearData(revparByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },

    // REVENUE
    {
      id: 'rooms-revenue',
      label: 'Rooms Revenue',
      group: 'REVENUE',
      type: 'line',
      years: createYearData(roomsRevenueByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'fnb-revenue',
      label: 'F&B Revenue',
      group: 'REVENUE',
      type: 'line',
      years: createYearData(fnbRevenueByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'spa-revenue',
      label: 'Spa Revenue',
      group: 'REVENUE',
      type: 'line',
      years: createYearData(spaRevenueByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'other-operating-revenue',
      label: 'Other Operating Revenue',
      group: 'REVENUE',
      type: 'line',
      years: createYearData(otherOperatingRevenueByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'total-revenue',
      label: 'Total Revenue',
      group: 'REVENUE',
      type: 'total',
      years: createYearData(totalRevenueByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },

    // DIRECT COSTS
    {
      id: 'rooms-direct-payroll',
      label: 'Rooms Direct Payroll',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(payrollByDept.rooms, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'rooms-commission',
      label: 'Rooms Commission',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(opexByCategory.roomsCommission, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'guest-supplies-cleaning',
      label: 'Guest Supplies & Cleaning',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(opexByCategory.guestSupplies, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'rooms-direct-costs',
      label: 'Rooms Direct Costs',
      group: 'DIRECT',
      type: 'subtotal',
      years: createYearData(roomsDirectCostsSubtotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'fnb-direct-payroll',
      label: 'F&B Direct Payroll',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(payrollByDept.fnb, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'cost-of-goods-sold',
      label: 'Cost of Goods Sold',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(opexByCategory.cogs, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'fnb-direct-costs',
      label: 'F&B Direct Costs',
      group: 'DIRECT',
      type: 'subtotal',
      years: createYearData(fnbDirectCostsSubtotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'me-costs',
      label: 'M&E Costs',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(opexByCategory.meCosts, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'me-direct-costs',
      label: 'M&E Direct Costs',
      group: 'DIRECT',
      type: 'subtotal',
      years: createYearData(meDirectCostsSubtotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'wellness-direct-payroll',
      label: 'Wellness Direct Payroll',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(payrollByDept.wellness, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'wellness-other-costs',
      label: 'Wellness Other Costs',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(opexByCategory.wellnessOtherCosts, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'wellness-direct-costs',
      label: 'Wellness Direct Costs',
      group: 'DIRECT',
      type: 'subtotal',
      years: createYearData(wellnessDirectCostsSubtotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'other-direct-costs',
      label: 'Other Direct Costs',
      group: 'DIRECT',
      type: 'line',
      years: createYearData(opexByCategory.otherDirectCosts, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'direct-costs-total',
      label: 'Direct Costs',
      group: 'DIRECT',
      type: 'subtotal',
      years: createYearData(directCostsTotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'goi',
      label: 'GOI',
      group: 'DIRECT',
      type: 'total',
      years: createYearData(goiByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },

    // UNDISTRIBUTED (INDIRECT COSTS)
    {
      id: 'ag-payroll',
      label: 'A&G Payroll',
      group: 'UNDISTRIBUTED',
      type: 'line',
      years: createYearData(payrollByDept.ag, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'other-ag',
      label: 'Other A&G',
      group: 'UNDISTRIBUTED',
      type: 'line',
      years: createYearData(opexByCategory.otherAG, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'admin-general',
      label: 'Administrative & General',
      group: 'UNDISTRIBUTED',
      type: 'subtotal',
      years: createYearData(agSubtotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'tech-subscriptions',
      label: 'Tech Subscriptions',
      group: 'UNDISTRIBUTED',
      type: 'line',
      years: createYearData(opexByCategory.techSubscriptions, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'it-telecommunications',
      label: 'Information & Telecommunications',
      group: 'UNDISTRIBUTED',
      type: 'subtotal',
      years: createYearData(itSubtotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'sales-marketing-payroll',
      label: 'Sales & Marketing Payroll',
      group: 'UNDISTRIBUTED',
      type: 'line',
      years: createYearData(payrollByDept.sales, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'other-sm',
      label: 'Other S&M',
      group: 'UNDISTRIBUTED',
      type: 'line',
      years: createYearData(opexByCategory.otherSM, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'sales-marketing',
      label: 'Sales & Marketing',
      group: 'UNDISTRIBUTED',
      type: 'subtotal',
      years: createYearData(smSubtotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'maintenance-payroll',
      label: 'Maintenance Payroll',
      group: 'UNDISTRIBUTED',
      type: 'line',
      years: createYearData(payrollByDept.maintenance, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'maintenance-other',
      label: 'Maintenance Other',
      group: 'UNDISTRIBUTED',
      type: 'line',
      years: createYearData(opexByCategory.maintenanceOther, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'property-operations-maintenance',
      label: 'Property Operations & Maintenance',
      group: 'UNDISTRIBUTED',
      type: 'subtotal',
      years: createYearData(pomSubtotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'utilities',
      label: 'Utilities',
      group: 'UNDISTRIBUTED',
      type: 'line',
      years: createYearData(opexByCategory.utilities, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'undistributed-total',
      label: 'Indirect Costs',
      group: 'UNDISTRIBUTED',
      type: 'subtotal',
      years: createYearData(indirectCostsTotal, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'gop',
      label: 'GOP',
      group: 'UNDISTRIBUTED',
      type: 'total',
      years: createYearData(gopByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },

    // FIXED
    {
      id: 'management-fees',
      label: 'Management Fees',
      group: 'FIXED',
      type: 'line',
      years: createYearData(opexByCategory.managementFees, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'property-taxes',
      label: 'Property Taxes',
      group: 'FIXED',
      type: 'line',
      years: createYearData(opexByCategory.propertyTaxes, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'insurance',
      label: 'Insurance',
      group: 'FIXED',
      type: 'line',
      years: createYearData(opexByCategory.insurance, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'ebitdar',
      label: 'EBITDAR',
      group: 'FIXED',
      type: 'total',
      years: createYearData(ebitdarByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'rent',
      label: 'Rent',
      group: 'FIXED',
      type: 'line',
      years: createYearData(rentByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'ebitda',
      label: 'EBITDA',
      group: 'FIXED',
      type: 'total',
      years: createYearData(ebitdaByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },

    // SUMMARY (Below NOI)
    {
      id: 'depreciation',
      label: 'Depreciation',
      group: 'SUMMARY',
      type: 'line',
      years: createYearData(Array(yearArray.length).fill(annualDepreciation), totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'interest-expense',
      label: 'Interest Expense',
      group: 'SUMMARY',
      type: 'line',
      years: createYearData(Array(yearArray.length).fill(annualInterest), totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    },
    {
      id: 'net-income',
      label: 'Net Income (Loss)',
      group: 'SUMMARY',
      type: 'total',
      years: createYearData(netIncomeByYear, totalRevenueByYear, roomsSoldByYear, roomsCountByYear)
    }
  ];

  // Apply horizon truncation and recalculate ratios
  return applyPLHorizon(rows, horizon, totalRevenueByYear, roomsSoldByYear, roomsCountByYear);
}