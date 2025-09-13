import { getMealPeriodAssumptions, getRoomsSoldByYear, getGuestsPerOccRoom, getSpaAssumptions } from './selectors';

export function coversPerDayFromUnderwriting(dealId: string, yearIdx: number) {
  const mp = getMealPeriodAssumptions(dealId);
  const roomsSoldArray = getRoomsSoldByYear(dealId);
  const roomsSold = roomsSoldArray[yearIdx] ?? 0;
  const guestsPerRoom = getGuestsPerOccRoom(dealId);

  const roomsSoldPerDay = roomsSold / 365; // Simple annualization
  const guestsInHousePerDay = roomsSoldPerDay * guestsPerRoom;

  const result: Record<string, number> = {};
  (['breakfast', 'lunch', 'dinner', 'bar'] as const).forEach(k => {
    const capture = mp.capturePct?.[k] ?? 0;
    const external = mp.externalCustomersPerDay?.[k] ?? 0;
    result[k] = Math.max(0, Math.round(guestsInHousePerDay * capture + external));
  });
  
  return result;
}

export function spaTreatmentsFromUnderwriting(dealId: string) {
  const spa = getSpaAssumptions(dealId);
  return { 
    treatmentsPerDay: spa?.treatmentsPerDay ?? 0, 
    openHours: spa?.openHours ?? 10 
  };
}

export function roomsSoldPerDayFromUnderwriting(dealId: string, yearIdx: number): number {
  const roomsSoldArray = getRoomsSoldByYear(dealId);
  const roomsSold = roomsSoldArray[yearIdx] ?? 0;
  return roomsSold / 365;
}