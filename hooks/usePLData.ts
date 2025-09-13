import { useMemo } from 'react';
import { calculatePLData, PLRow } from '../lib/pl/plCalculations';
import { applyPLHorizon } from '../lib/pl/plCalculations';
import { getDeal } from '../lib/dealStore';
import { totalRooms } from '../lib/rooms';

export function usePLData(dealId: string | undefined, yearCount: number = 10) {
  const plData = useMemo(() => {
    if (!dealId) return [];
    
    // Single deal reference - no redeclaration  
    const deal = getDeal(dealId);
    if (!deal) return [];
    
    const baseRows = calculatePLData(dealId, yearCount);
    
    // Apply horizon logic
    const exitSettings = deal.assumptions?.exitSettings;
    const exitYear = exitSettings?.strategy === "SALE" ? exitSettings.sale.exitYear :
                     exitSettings?.strategy === "REFINANCE" ? exitSettings.refinance.refinanceYear :
                     null;
    
    const horizon = exitYear ?? 10;
    
    // Compute rooms count for /PR ratio (Per Room, not per room-night) 
    const roomsCount = totalRooms(deal.roomTypes);
    
    // Build per-year rooms count (keys in operation), fallback to constant roomsCount
    const roomsCountByYear: number[] = Array.from({ length: yearCount }, (_, idx) => {
      // If you have phasing data, prefer it here:
      const phased = deal.roomsOpenByYear?.[idx];
      return (phased ?? roomsCount) || 0;
    });
    
    // Get revenue and room data for ratio calculations
    const totalRevenueRow = baseRows.find(r => r.id === 'total-revenue');
    const roomsSoldRow = baseRows.find(r => r.id === 'rooms-sold');
    
    const totalRevenueByYear = totalRevenueRow?.years.map(y => y.total) ?? Array(10).fill(0);
    const roomsSoldByYear = roomsSoldRow?.years.map(y => y.total) ?? Array(10).fill(0);
    
    return applyPLHorizon(baseRows, horizon, totalRevenueByYear, roomsSoldByYear, roomsCountByYear);
  }, [dealId, yearCount]);

  const exitYear = useMemo(() => {
    if (!dealId) return null;
    const deal = getDeal(dealId);
    const exitSettings = deal?.assumptions?.exitSettings;
    
    if (exitSettings?.strategy === "SALE") {
      return exitSettings.sale.exitYear;
    } else if (exitSettings?.strategy === "REFINANCE") {
      return exitSettings.refinance.refinanceYear;
    }
    
    return null; // Hold forever
  }, [dealId]);

  const kpiRows = useMemo(() => {
    return plData.filter(row => row.group === 'KPIS');
  }, [plData]);

  const operatingRows = useMemo(() => {
    return plData.filter(row => row.group !== 'KPIS');
  }, [plData]);

  return {
    allRows: plData,
    kpiRows,
    operatingRows,
    exitYear
  };
}