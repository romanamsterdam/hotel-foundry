import { MonthRow } from "../types/deal";

export function computeMonthRow(
  i: number,            // 0..11
  year: number,
  rooms: number,
  adr: number,
  occPct: number
): MonthRow {
  const month = i + 1;
  const days = new Date(year, month, 0).getDate();
  const roomsAvailable = rooms * days;
  const roomsSold = roomsAvailable * (occPct / 100);
  const revpar = adr * (occPct / 100);
  const roomsRevenue = roomsSold * adr;

  return { month, adr, occPct, revpar, days, roomsAvailable, roomsSold, roomsRevenue };
}

export function rollupTotals(rows: MonthRow[]) {
  const roomsAvailable = rows.reduce((s, r) => s + r.roomsAvailable, 0);
  const roomsSold = rows.reduce((s, r) => s + r.roomsSold, 0);
  const roomsRevenue = rows.reduce((s, r) => s + r.roomsRevenue, 0);
  const avgADR = roomsSold > 0 ? roomsRevenue / roomsSold : 0;
  const avgOccPct = roomsAvailable > 0 ? (roomsSold / roomsAvailable) * 100 : 0;
  const avgRevPAR = avgADR * (avgOccPct / 100);
  return { roomsAvailable, roomsSold, roomsRevenue, avgADR, avgOccPct, avgRevPAR };
}