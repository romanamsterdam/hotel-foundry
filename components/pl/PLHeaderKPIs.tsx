import { PLRow } from '../../lib/pl/plCalculations';
import { formatCurrency } from '../../lib/utils';
import { formatOccupancyPercent, toFraction } from '../../lib/finance/units';
import { getRoomsKpisByYear } from '../../lib/finance/roomsComputed';

interface PLHeaderKPIsProps {
  kpiRows: PLRow[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  currency: string;
  exitYear: number | null;
}

export default function PLHeaderKPIs({ kpiRows, selectedYear, onYearChange, currency, exitYear, dealId }: PLHeaderKPIsProps & { dealId: string }) {
  // Get computed KPIs from rooms module for accurate occupancy
  const roomsKpis = getRoomsKpisByYear(dealId);
  const yearKey = `y${selectedYear}` as keyof typeof roomsKpis.occByYear;
  
  const getKpiValue = (id: string) => {
    const row = kpiRows.find(r => r.id === id);
    if (!row) return 0;
    const yearData = row.years.find(y => y.year === selectedYear);
    return yearData?.total || 0;
  };

  const formatKpiValue = (id: string, value: number) => {
    if (id === 'occupancy') {
      // Use computed occupancy from rooms module (already a fraction)
      const occFraction = toFraction(roomsKpis.occByYear[yearKey] ?? 0) || 
                         ((roomsKpis.roomsSoldByYear[yearKey] ?? 0) / Math.max(1, roomsKpis.roomsAvailableByYear[yearKey] ?? 1));
      return formatOccupancyPercent(occFraction);
    }
    if (id === 'rooms-open' || id === 'rooms-available' || id === 'rooms-sold') {
      return Math.round(value).toLocaleString();
    }
    return formatCurrency(value, currency);
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Key Performance Indicators</h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-slate-600">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white min-w-[100px]"
          >
            {Array.from({length: 10}, (_, i) => i + 1).map(year => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="text-sm font-medium text-blue-700">Rooms Open</div>
          <div className="text-xl lg:text-2xl font-bold text-blue-900">
            {formatKpiValue('rooms-open', getKpiValue('rooms-open'))}
          </div>
        </div>
        
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="text-sm font-medium text-blue-700">Rooms Available</div>
          <div className="text-xl lg:text-2xl font-bold text-blue-900">
            {formatKpiValue('rooms-available', getKpiValue('rooms-available'))}
          </div>
        </div>
        
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="text-sm font-medium text-green-700">Rooms Sold</div>
          <div className="text-xl lg:text-2xl font-bold text-green-900">
            {formatKpiValue('rooms-sold', getKpiValue('rooms-sold'))}
          </div>
        </div>
        
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
          <div className="text-sm font-medium text-purple-700">ADR</div>
          <div className="text-xl lg:text-2xl font-bold text-purple-900">
            {formatKpiValue('adr', getKpiValue('adr'))}
          </div>
        </div>
        
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="text-sm font-medium text-amber-700">Occupancy</div>
          <div className="text-xl lg:text-2xl font-bold text-amber-900">
            {formatKpiValue('occupancy', getKpiValue('occupancy'))}
          </div>
        </div>
        
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
          <div className="text-sm font-medium text-emerald-700">RevPAR</div>
          <div className="text-xl lg:text-2xl font-bold text-emerald-900">
            {formatKpiValue('revpar', getKpiValue('revpar'))}
          </div>
        </div>
      </div>
    </div>
  );
}