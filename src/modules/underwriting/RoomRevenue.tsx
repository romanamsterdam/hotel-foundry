import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RotateCcw, Info, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useToast } from '../../components/ui/toast';
import { useProjectSave } from '../../lib/persist/ProjectSaveContext';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { getTotalRooms } from '../../lib/rooms';
import { formatCurrency } from '../../lib/utils';
import { Deal, RoomRevenueModel, MonthRow } from '../../types/deal';
import { seasonalityPresets, presetLabels, SeasonalityPresetKey } from '../../data/seasonalityPresets';
import { monthNames, daysInMonth } from '../../lib/dateMath';
import { computeMonthRow, rollupTotals } from '../../lib/roomRevenue';
import PresetCard from './room-revenue/PresetCard';
import SetAdrDialog from './room-revenue/SetAdrDialog';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';

interface RoomRevenueProps {
  dealId: string;
  onSaved?: () => void;
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

function createDefaultModel(deal: Deal): RoomRevenueModel {
  const rooms = getTotalRooms(deal);
  const year = new Date().getFullYear();
  const defaultADR = 140;
  const defaultOccupancy = seasonalityPresets.majorCity;
  
  const months = Array.from({ length: 12 }, (_, i) => 
    computeMonthRow(i, year, rooms, defaultADR, defaultOccupancy[i])
  );
  
  const totals = rollupTotals(months);
  
  return {
    seasonalityPreset: 'majorCity',
    months,
    totals,
    currency: deal.currency
  };
}

function detectPreset(months: MonthRow[]): SeasonalityPresetKey | 'custom' {
  const occupancies = months.map(m => m.occPct);
  
  for (const [preset, values] of Object.entries(seasonalityPresets)) {
    const matches = values.every((val, i) => Math.abs(val - occupancies[i]) <= 1);
    if (matches) return preset as SeasonalityPresetKey;
  }
  
  return 'custom';
}

export default function RoomRevenue({ dealId, onSaved }: RoomRevenueProps) {
  const { toast } = useToast();
  const { saveNow } = useProjectSave();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [model, setModel] = useState<RoomRevenueModel | null>(null);
  const [originalModel, setOriginalModel] = useState<RoomRevenueModel | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());
  const [showSetAdrDialog, setShowSetAdrDialog] = useState(false);

  // Load deal and room revenue model
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      let roomRevenueModel: RoomRevenueModel;
      if (foundDeal.roomRevenue) {
        roomRevenueModel = foundDeal.roomRevenue;
      } else {
        roomRevenueModel = createDefaultModel(foundDeal);
      }
      
      setModel(roomRevenueModel);
      setOriginalModel(roomRevenueModel);
    }
  }, [dealId]);

  const animateFields = useCallback((fields: string[]) => {
    setAnimatedFields(new Set(fields));
    setTimeout(() => setAnimatedFields(new Set()), 1000);
  }, []);

  const debouncedRecalculate = useCallback(
    debounce((newModel: RoomRevenueModel) => {
      const updatedTotals = rollupTotals(newModel.months);
      const finalModel = { ...newModel, totals: updatedTotals };
      setModel(finalModel);
      animateFields(['totals', 'kpis']);
    }, 200),
    [animateFields]
  );

  const handlePresetSelect = (preset: SeasonalityPresetKey) => {
    if (!model || !deal) return;
    
    const rooms = getTotalRooms(deal);
    const year = new Date().getFullYear();
    const occupancies = seasonalityPresets[preset];
    
    const newMonths = model.months.map((month, i) => 
      computeMonthRow(i, year, rooms, month.adr, occupancies[i])
    );
    
    const newModel = {
      ...model,
      seasonalityPreset: preset,
      months: newMonths
    };
    
    debouncedRecalculate(newModel);
    animateFields(['preset', 'table']);
  };

  const handleCellChange = (monthIndex: number, field: 'adr' | 'occPct', value: number) => {
    if (!model || !deal) return;
    
    const rooms = getTotalRooms(deal);
    const year = new Date().getFullYear();
    
    const newMonths = [...model.months];
    const currentMonth = newMonths[monthIndex];
    
    if (field === 'adr') {
      newMonths[monthIndex] = computeMonthRow(monthIndex, year, rooms, value, currentMonth.occPct);
    } else {
      // Clamp occupancy between 0-100
      const clampedValue = Math.max(0, Math.min(100, value));
      newMonths[monthIndex] = computeMonthRow(monthIndex, year, rooms, currentMonth.adr, clampedValue);
    }
    
    // Detect if preset still matches
    const detectedPreset = detectPreset(newMonths);
    
    const newModel = {
      ...model,
      seasonalityPreset: detectedPreset,
      months: newMonths
    };
    
    debouncedRecalculate(newModel);
    animateFields([`month-${monthIndex}`, 'totals']);
  };

  const handleResetBaseline = () => {
    if (!deal) return;
    
    const newModel = createDefaultModel(deal);
    setModel(newModel);
    animateFields(['preset', 'table', 'totals', 'kpis']);
    toast.success("Reset to baseline assumptions");
  };

  const handleSetAdr = (adr: number, applyTo: 'all' | 'low' | 'high') => {
    if (!model || !deal) return;
    
    const rooms = getTotalRooms(deal);
    const year = new Date().getFullYear();
    
    const newMonths = model.months.map((month, i) => {
      let shouldApply = false;
      
      switch (applyTo) {
        case 'all':
          shouldApply = true;
          break;
        case 'low':
          shouldApply = month.occPct <= 60;
          break;
        case 'high':
          shouldApply = month.occPct >= 80;
          break;
      }
      
      if (shouldApply) {
        return computeMonthRow(i, year, rooms, adr, month.occPct);
      }
      return month;
    });
    
    const newModel = {
      ...model,
      months: newMonths
    };
    
    debouncedRecalculate(newModel);
    animateFields(['table', 'totals', 'kpis']);
    toast.success(`ADR updated for ${applyTo === 'all' ? 'all' : applyTo} months`);
  };

  const handleSave = async () => {
    if (!deal || !model) return;

    setSaveState('saving');
    
    try {
      // Save to Supabase first
      await saveNow("Room Revenue");
      
      // Then update local storage
      const updatedDeal: Deal = {
        ...deal,
        roomRevenue: model,
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "roomRevenue", true);
      setOriginalModel(model);
      
      setSaveState('success');
      toast.success("Room revenue saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save room revenue");
    }
  };

  const handleCancel = () => {
    if (originalModel) {
      setModel(originalModel);
      toast.info("Changes discarded");
    }
  };

  if (!deal || !model) {
    return <div>Loading...</div>;
  }

  const rooms = getTotalRooms(deal);
  
  if (rooms === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Room Revenue</h3>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                Add rooms in Property Details to model revenue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  // Chart data
  const chartData = model.months.map((month, i) => ({
    month: monthNames[i],
    adr: Math.round(month.adr),
    occupancy: Math.round(month.occPct * 10) / 10,
    revpar: Math.round(month.revpar),
    roomsSold: Math.round(month.roomsSold),
    roomsRevenue: Math.round(month.roomsRevenue)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Room Revenue</h3>
          <p className="text-sm text-slate-600">
            Model monthly ADR and occupancy patterns with seasonality presets and live calculations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSetAdrDialog(true)}
            className="flex items-center space-x-2"
          >
            <DollarSign className="h-4 w-4" />
            <span>Set Base ADR</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetBaseline}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Baseline</span>
          </Button>
        </div>
      </div>

      {/* Visual Seasonality Presets */}
      <div className={`space-y-4 ${getAnimationClass('preset')}`}>
        <h4 className="font-medium text-slate-900">Seasonality Presets</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PresetCard
            id="beach"
            title="Beach Resort"
            subtitle="Low winter, high summer"
            months={seasonalityPresets.beach}
            active={model.seasonalityPreset === 'beach'}
            onSelect={() => handlePresetSelect('beach')}
          />
          <PresetCard
            id="winterResort"
            title="Winter Resort"
            subtitle="High winter, low summer"
            months={seasonalityPresets.winterResort}
            active={model.seasonalityPreset === 'winterResort'}
            onSelect={() => handlePresetSelect('winterResort')}
          />
          <PresetCard
            id="majorCity"
            title="City Hotel"
            subtitle="Strong year-round"
            months={seasonalityPresets.majorCity}
            active={model.seasonalityPreset === 'majorCity'}
            onSelect={() => handlePresetSelect('majorCity')}
          />
          <PresetCard
            id="businessCity"
            title="Business Hotel"
            subtitle="Weekday heavy, softer summer"
            months={seasonalityPresets.businessCity}
            active={model.seasonalityPreset === 'businessCity'}
            onSelect={() => handlePresetSelect('businessCity')}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${getAnimationClass('kpis')}`}>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Total Rooms Revenue</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(model.totals.roomsRevenue, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Avg ADR</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(model.totals.avgADR, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Avg Occupancy</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {model.totals.avgOccPct.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Avg RevPAR</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(model.totals.avgRevPAR, deal.currency)}
          </div>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Month</th>
              <th className="text-right py-3 px-4 font-medium text-slate-700">ADR ({deal.currency})</th>
              <th className="text-right py-3 px-4 font-medium text-slate-700">Occupancy (%)</th>
              <th className="text-right py-3 px-4 font-medium text-slate-700">RevPAR ({deal.currency})</th>
              <th className="text-right py-3 px-4 font-medium text-slate-700">Rooms Available</th>
              <th className="text-right py-3 px-4 font-medium text-slate-700">Rooms Sold</th>
              <th className="text-right py-3 px-4 font-medium text-slate-700">Rooms Revenue ({deal.currency})</th>
            </tr>
          </thead>
          <tbody className={getAnimationClass('table')}>
            {model.months.map((month, i) => (
              <tr key={i} className={`border-b border-slate-100 ${getAnimationClass(`month-${i}`)}`}>
                <td className="py-3 px-4 font-medium text-slate-900">{monthNames[i]}</td>
                <td className="py-3 px-4 text-right">
                  <input
                    type="number"
                    value={month.adr || ''}
                    onChange={(e) => handleCellChange(i, 'adr', Number(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-right"
                    min="0"
                  />
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="relative">
                    <input
                      type="number"
                      value={month.occPct || ''}
                      onChange={(e) => handleCellChange(i, 'occPct', Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-right pr-6"
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-2 top-1 text-slate-500 pointer-events-none text-sm">%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-slate-600">
                  {formatCurrency(month.revpar, deal.currency)}
                </td>
                <td className="py-3 px-4 text-right text-slate-600">
                  {Math.round(month.roomsAvailable).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-slate-600">
                  {Math.round(month.roomsSold).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-slate-600">
                  {formatCurrency(month.roomsRevenue, deal.currency)}
                </td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className={`border-t-2 border-slate-300 bg-slate-100 ${getAnimationClass('totals')}`}>
              <td className="py-4 px-4 font-bold text-slate-900">TOTALS</td>
              <td className="py-4 px-4 text-right font-bold text-slate-900">
                {formatCurrency(model.totals.avgADR, deal.currency)}
              </td>
              <td className="py-4 px-4 text-right font-bold text-slate-900">
                {model.totals.avgOccPct.toFixed(1)}%
              </td>
              <td className="py-4 px-4 text-right font-bold text-slate-900">
                {formatCurrency(model.totals.avgRevPAR, deal.currency)}
              </td>
              <td className="py-4 px-4 text-right font-bold text-slate-900">
                {Math.round(model.totals.roomsAvailable).toLocaleString()}
              </td>
              <td className="py-4 px-4 text-right font-bold text-slate-900">
                {Math.round(model.totals.roomsSold).toLocaleString()}
              </td>
              <td className="py-4 px-4 text-right font-bold text-slate-900">
                {formatCurrency(model.totals.roomsRevenue, deal.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Live Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <h4 className="font-semibold text-slate-900 mb-4">Monthly Performance Chart</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="currency" orientation="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="percent" orientation="right" tick={{ fontSize: 12 }} />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-slate-900">{label}</p>
                      <p className="text-sm">ADR: {formatCurrency(data.adr, deal.currency)}</p>
                      <p className="text-sm">Occupancy: {data.occupancy}%</p>
                      <p className="text-sm">RevPAR: {formatCurrency(data.revpar, deal.currency)}</p>
                      <p className="text-sm">Rooms Sold: {data.roomsSold.toLocaleString()}</p>
                      <p className="text-sm">Revenue: {formatCurrency(data.roomsRevenue, deal.currency)}</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar yAxisId="currency" dataKey="adr" fill="#14b8a6" name="ADR" />
              <Bar yAxisId="currency" dataKey="revpar" fill="#06b6d4" name="RevPAR" />
              <Line yAxisId="percent" type="monotone" dataKey="occupancy" stroke="#f59e0b" strokeWidth={3} name="Occupancy %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Set ADR Dialog */}
      <SetAdrDialog
        isOpen={showSetAdrDialog}
        onClose={() => setShowSetAdrDialog(false)}
        onApply={handleSetAdr}
        currentAdr={model.months.length > 0 ? model.months[0].adr : 140}
      />

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className={`${
            saveState === 'success' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-brand-600 hover:bg-brand-700'
          } text-white flex items-center space-x-2`}
        >
          {saveState === 'saving' && <TrendingUp className="h-4 w-4 animate-spin" />}
          {saveState === 'success' && <TrendingUp className="h-4 w-4" />}
          <span>
            {saveState === 'saving' && 'Saving...'}
            {saveState === 'success' && 'Saved ✓'}
            {saveState === 'idle' && 'Save changes'}
          </span>
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={saveState === 'saving'}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}