import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Info, BarChart3 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useToast } from '../../components/ui/toast';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { getTotalRooms } from '../../lib/rooms';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { FnBState, MealKey, MealPeriod } from '../../types/fnb';
import { computeAdvancedAnnual, monthlySeries, RoomsSelectors } from '../../lib/fnbCalc';
import { advancedToSimple, simpleToAdvanced } from '../../lib/fnbSync';
import { AlertTriangle, Info as InfoIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';

interface FnBRevenueProps {
  dealId: string;
  onSaved?: () => void;
}

// Default F&B state
function createDefaultFnBState(): FnBState {
  return {
    mode: "advanced",
    simple: {
      avgGuestsPerOccRoom: 1.8,
      totalGuestCapturePct: 225, // Sum of advanced captures
      avgCheckGuest: 20,
      externalCoversPerDay: 65,
      avgCheckExternal: 25
    },
    advanced: {
      breakfast: {
        key: "breakfast",
        label: "Breakfast",
        icon: "☕",
        guestCapturePct: 80,
        avgCheckGuest: 12,
        externalCoversPerDay: 5,
        avgCheckExternal: 15
      },
      lunch: {
        key: "lunch",
        label: "Lunch", 
        icon: "🥗",
        guestCapturePct: 40,
        avgCheckGuest: 18,
        externalCoversPerDay: 15,
        avgCheckExternal: 22
      },
      dinner: {
        key: "dinner",
        label: "Dinner",
        icon: "🍽️", 
        guestCapturePct: 60,
        avgCheckGuest: 35,
        externalCoversPerDay: 20,
        avgCheckExternal: 45
      },
      bar: {
        key: "bar",
        label: "Bar",
        icon: "🍷",
        guestCapturePct: 45,
        avgCheckGuest: 15,
        externalCoversPerDay: 25,
        avgCheckExternal: 18
      }
    },
    distributionWeights: { breakfast: 30, lunch: 25, dinner: 35, bar: 10 }
  };
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function FnBRevenue({ dealId, onSaved }: FnBRevenueProps) {
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [fnbState, setFnbState] = useState<FnBState | null>(null);
  const [originalState, setOriginalState] = useState<FnBState | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [chartPeriod, setChartPeriod] = useState<'annual' | 'monthly'>('annual');
  const [showDistributionSettings, setShowDistributionSettings] = useState(false);
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());

  // Load deal and F&B state
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      let fnbData: FnBState;
      if (foundDeal.fnbRevenue) {
        fnbData = foundDeal.fnbRevenue;
      } else {
        fnbData = createDefaultFnBState();
      }
      
      setFnbState(fnbData);
      setOriginalState(fnbData);
    }
  }, [dealId]);

  const animateFields = useCallback((fields: string[]) => {
    setAnimatedFields(new Set(fields));
    setTimeout(() => setAnimatedFields(new Set()), 1000);
  }, []);

  const debouncedRecalculate = useCallback(
    debounce(() => {
      animateFields(['kpis', 'chart']);
    }, 200),
    [animateFields]
  );

  // Get rooms data from deal
  const getRoomsSelectors = (): RoomsSelectors => {
    if (!deal?.roomRevenue) {
      return {
        roomsAvailableByMonth: Array(12).fill(0),
        roomsSoldByMonth: Array(12).fill(0),
        roomsAvailableYearTotal: 0,
        roomsSoldYearTotal: 0
      };
    }

    const { months, totals } = deal.roomRevenue;
    return {
      roomsAvailableByMonth: months.map(m => m.roomsAvailable),
      roomsSoldByMonth: months.map(m => m.roomsSold),
      roomsAvailableYearTotal: totals.roomsAvailable,
      roomsSoldYearTotal: totals.roomsSold
    };
  };

  const handleModeToggle = (mode: "simple" | "advanced") => {
    if (!fnbState) return;
    
    if (mode === "simple") {
      // Advanced → Simple: derive simple values
      const derivedSimple = advancedToSimple(fnbState.advanced, fnbState.simple.avgGuestsPerOccRoom);
      setFnbState({
        ...fnbState,
        mode: "simple",
        simple: derivedSimple
      });
    } else {
      // Simple → Advanced: keep existing advanced unless empty
      setFnbState({
        ...fnbState,
        mode: "advanced"
      });
    }
    
    debouncedRecalculate();
  };

  const handleSimpleFieldChange = (field: keyof FnBState['simple'], value: number) => {
    if (!fnbState) return;
    
    const newState = {
      ...fnbState,
      simple: {
        ...fnbState.simple,
        [field]: Math.max(0, value) // Prevent negatives
      }
    };
    
    setFnbState(newState);
    debouncedRecalculate();
  };

  const handleAdvancedFieldChange = (mealKey: MealKey, field: keyof MealPeriod, value: number) => {
    if (!fnbState) return;
    
    let clampedValue = Math.max(0, value);
    if (field === 'guestCapturePct') {
      clampedValue = Math.min(100, clampedValue);
    }
    
    const newState = {
      ...fnbState,
      advanced: {
        ...fnbState.advanced,
        [mealKey]: {
          ...fnbState.advanced[mealKey],
          [field]: clampedValue
        }
      }
    };
    
    setFnbState(newState);
    debouncedRecalculate();
  };

  const handleDistributionWeightChange = (mealKey: MealKey, weight: number) => {
    if (!fnbState) return;
    
    const newWeights = {
      ...fnbState.distributionWeights,
      [mealKey]: Math.max(0, Math.min(100, weight))
    };
    
    setFnbState({
      ...fnbState,
      distributionWeights: newWeights
    });
  };

  const handleApplySimpleToMeals = () => {
    if (!fnbState) return;
    
    const newAdvanced = simpleToAdvanced(fnbState.simple, fnbState.distributionWeights);
    setFnbState({
      ...fnbState,
      advanced: newAdvanced
    });
    
    toast.success("Simple values applied to meal periods");
    debouncedRecalculate();
  };

  const handleSave = async () => {
    if (!deal || !fnbState) return;

    setSaveState('saving');
    
    try {
      const updatedDeal: Deal = {
        ...deal,
        fnbRevenue: fnbState,
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "fbRevenue", true);
      setOriginalState(fnbState);
      
      setSaveState('success');
      toast.success("F&B revenue saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save F&B revenue");
    }
  };

  const handleCancel = () => {
    if (originalState) {
      setFnbState(originalState);
      toast.info("Changes discarded");
    }
  };

  // Facility validation helpers
  const getFacilityWarnings = () => {
    if (!deal || !fnbState) return [];
    
    const warnings = [];
    
    // Use normalized facilities if available, fallback to amenities
    const facilities = Array.isArray(deal.facilities) ? deal.facilities : [];
    const hasRestaurant = facilities.includes('Restaurant') || deal.amenities?.restaurant;
    const hasBar = facilities.includes('Bar') || deal.amenities?.bar;
    
    // Check restaurant facility vs meal revenue inputs
    if (!hasRestaurant) {
      const hasRestaurantRevenue = fnbState.mode === 'advanced' 
        ? (fnbState.advanced.breakfast.guestCapturePct > 0 || 
           fnbState.advanced.breakfast.externalCoversPerDay > 0 ||
           fnbState.advanced.lunch.guestCapturePct > 0 || 
           fnbState.advanced.lunch.externalCoversPerDay > 0 ||
           fnbState.advanced.dinner.guestCapturePct > 0 || 
           fnbState.advanced.dinner.externalCoversPerDay > 0)
        : (fnbState.simple.totalGuestCapturePct > 0 || fnbState.simple.externalCoversPerDay > 0);
        
      if (hasRestaurantRevenue) {
        warnings.push({
          type: 'warning' as const,
          message: 'Restaurant not enabled in Facilities. Please confirm whether F&B revenues should apply.',
          section: 'restaurant'
        });
      }
    }
    
    // Check bar facility vs bar revenue inputs
    if (!hasBar) {
      const hasBarRevenue = fnbState.mode === 'advanced'
        ? (fnbState.advanced.bar.guestCapturePct > 0 || fnbState.advanced.bar.externalCoversPerDay > 0)
        : (fnbState.simple.totalGuestCapturePct > 0 || fnbState.simple.externalCoversPerDay > 0);
        
      if (hasBarRevenue) {
        warnings.push({
          type: 'warning' as const,
          message: 'Bar not enabled in Facilities. Please confirm whether Bar revenue should apply.',
          section: 'bar'
        });
      }
    }
    
    return warnings;
  };

  const facilityWarnings = getFacilityWarnings();

  if (!deal || !fnbState) {
    return <div>Loading...</div>;
  }

  const rooms = getTotalRooms(deal);
  
  if (rooms === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">🍴 Food & Beverage Revenue</h3>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                Add rooms in Property Details to model F&B revenue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roomsSelectors = getRoomsSelectors();
  const results = computeAdvancedAnnual(fnbState, roomsSelectors);
  const monthlyData = monthlySeries(fnbState, roomsSelectors);

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  // Chart data
  const chartData = chartPeriod === 'annual' 
    ? Object.entries(results.byMeal).map(([key, data]) => ({
        name: fnbState.advanced[key as MealKey].label,
        internal: Math.round(data.internal),
        external: Math.round(data.external),
        total: Math.round(data.total)
      }))
    : monthlyData.map((month, i) => ({
        name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        total: Math.round(month.monthTotal),
        breakfast: Math.round(month.byMeal.breakfast.total),
        lunch: Math.round(month.byMeal.lunch.total),
        dinner: Math.round(month.byMeal.dinner.total),
        bar: Math.round(month.byMeal.bar.total)
      }));

  const weightsSum = Object.values(fnbState.distributionWeights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">🍴 Food & Beverage Revenue</h3>
          <p className="text-sm text-slate-600">
            Model F&B revenue from guest capture and external customers across meal periods.
          </p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleModeToggle('simple')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
              fnbState.mode === 'simple'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => handleModeToggle('advanced')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
              fnbState.mode === 'advanced'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Mode Banner */}
      {fnbState.mode === 'advanced' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-blue-800 text-sm font-medium">
            Advanced Meal Period Control — Fine‑tune each meal period individually for precise F&B revenue modeling.
          </p>
        </div>
      )}

      {/* Facility Validation Warnings */}
      {facilityWarnings.length > 0 && (
        <div className="space-y-3">
          {facilityWarnings.map((warning, index) => (
            <div key={index} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium text-sm">
                    {warning.message}
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    Update facilities in Property Details to resolve this warning.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guest Configuration */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Guest Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Average Guests per Occupied Room
              </label>
              <input
                type="number"
                value={fnbState.simple.avgGuestsPerOccRoom || ''}
                onChange={(e) => handleSimpleFieldChange('avgGuestsPerOccRoom', Number(e.target.value) || 0)}
                className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                min="0"
                step="0.1"
              />
              <p className="mt-1 text-xs text-slate-500">
                Typically 1.5–2.2 for leisure hotels
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${getAnimationClass('kpis')}`}>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Internal F&B Revenue</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.internalTotal, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">External F&B Revenue</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.externalTotal, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Total F&B Revenue</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.totalFnb, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">F&B RevPAR</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.fnbRevPAR, deal.currency)}
          </div>
        </div>
      </div>

      {/* Mode-specific Content */}
      {fnbState.mode === 'simple' ? (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Aggregated F&B Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Guest Capture %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fnbState.simple.totalGuestCapturePct || ''}
                    onChange={(e) => handleSimpleFieldChange('totalGuestCapturePct', Number(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    max="400"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Sum of meal captures in Advanced can exceed 100%; Simple uses a total cap of 100%
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Avg Check (Guest)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">€</span>
                  <input
                    type="number"
                    value={fnbState.simple.avgCheckGuest || ''}
                    onChange={(e) => handleSimpleFieldChange('avgCheckGuest', Number(e.target.value) || 0)}
                    className="w-32 pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  External Customers/Day (all meals)
                </label>
                <input
                  type="number"
                  value={fnbState.simple.externalCoversPerDay || ''}
                  onChange={(e) => handleSimpleFieldChange('externalCoversPerDay', Number(e.target.value) || 0)}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Avg Check (External)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">€</span>
                  <input
                    type="number"
                    value={fnbState.simple.avgCheckExternal || ''}
                    onChange={(e) => handleSimpleFieldChange('avgCheckExternal', Number(e.target.value) || 0)}
                    className="w-32 pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Distribution Settings */}
            <div>
              <button
                onClick={() => setShowDistributionSettings(!showDistributionSettings)}
                className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                <span>Distribution Settings</span>
                <span className={`transform transition-transform ${showDistributionSettings ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {showDistributionSettings && (
                <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-600 mb-4">
                    Weights for distributing simple values to meal periods (must sum to 100%)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(fnbState.distributionWeights).map(([key, weight]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-700 mb-1 capitalize">
                          {key}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={weight || ''}
                            onChange={(e) => handleDistributionWeightChange(key as MealKey, Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                            min="0"
                            max="100"
                          />
                          <span className="absolute right-2 top-1 text-slate-500 text-xs">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Total: {weightsSum}% {weightsSum !== 100 && <span className="text-red-600">(should be 100%)</span>}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleApplySimpleToMeals}
                      className="text-xs"
                    >
                      Apply Simple to Meals
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Meal Period Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Meal Period</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Guest Capture %</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Avg Check (Guest)</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">External Customers/Day</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Avg Check (External)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fnbState.advanced).map(([key, meal]) => (
                    <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{meal.icon}</span>
                          <span className="font-medium text-slate-900">{meal.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative inline-block">
                          <input
                            type="number"
                            value={meal.guestCapturePct || ''}
                            onChange={(e) => handleAdvancedFieldChange(key as MealKey, 'guestCapturePct', Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
                            min="0"
                            max="100"
                          />
                          <span className="absolute right-2 top-1 text-slate-500 text-sm pointer-events-none">%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative inline-block">
                          <span className="absolute left-2 top-1 text-slate-500 text-sm">€</span>
                          <input
                            type="number"
                            value={meal.avgCheckGuest || ''}
                            onChange={(e) => handleAdvancedFieldChange(key as MealKey, 'avgCheckGuest', Number(e.target.value) || 0)}
                            className="w-24 pl-6 pr-2 py-1 border border-slate-300 rounded text-right"
                            min="0"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={meal.externalCoversPerDay || ''}
                          onChange={(e) => handleAdvancedFieldChange(key as MealKey, 'externalCoversPerDay', Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
                          min="0"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative inline-block">
                          <span className="absolute left-2 top-1 text-slate-500 text-sm">€</span>
                          <input
                            type="number"
                            value={meal.avgCheckExternal || ''}
                            onChange={(e) => handleAdvancedFieldChange(key as MealKey, 'avgCheckExternal', Number(e.target.value) || 0)}
                            className="w-24 pl-6 pr-2 py-1 border border-slate-300 rounded text-right"
                            min="0"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card className={`border-slate-200 ${getAnimationClass('chart')}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>F&B Revenue Breakdown</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartPeriod('annual')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  chartPeriod === 'annual'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Annual
              </button>
              <button
                onClick={() => setChartPeriod('monthly')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  chartPeriod === 'monthly'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-slate-900">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value as number, deal.currency)}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                {chartPeriod === 'annual' ? (
                  <>
                    <Bar dataKey="internal" fill="#14b8a6" name="Internal Revenue" />
                    <Bar dataKey="external" fill="#06b6d4" name="External Revenue" />
                  </>
                ) : (
                  <>
                    <Bar dataKey="breakfast" fill="#f59e0b" name="Breakfast" />
                    <Bar dataKey="lunch" fill="#10b981" name="Lunch" />
                    <Bar dataKey="dinner" fill="#3b82f6" name="Dinner" />
                    <Bar dataKey="bar" fill="#8b5cf6" name="Bar" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
            {saveState === 'idle' && 'Save & Update KPIs'}
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

      {/* Footer timestamp */}
      <div className="text-center">
        <p className="text-xs text-slate-500">
          Recalculated • {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}