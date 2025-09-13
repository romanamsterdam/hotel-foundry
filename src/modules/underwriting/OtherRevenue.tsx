import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Info, BarChart3 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { useToast } from '../../components/ui/toast';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { getTotalRooms } from '../../lib/rooms';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { OtherRevenueState, OtherRevenueMode } from '../../types/otherRevenue';
import { calculateOtherRevenue } from '../../lib/otherRevenueCalc';
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

interface OtherRevenueProps {
  dealId: string;
  onSaved?: () => void;
}

// Default state
function createDefaultOtherRevenueState(): OtherRevenueState {
  return {
    spa: {
      treatmentsPerDay: 4,
      avgPricePerTreatment: 70
    },
    other: {
      mode: "percentage",
      percentageOfRooms: 5,
      monthlyFixed: 0
    }
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

export default function OtherRevenue({ dealId, onSaved }: OtherRevenueProps) {
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [otherRevenueState, setOtherRevenueState] = useState<OtherRevenueState | null>(null);
  const [originalState, setOriginalState] = useState<OtherRevenueState | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());

  // Load deal and other revenue state
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      let otherRevData: OtherRevenueState;
      if (foundDeal.otherRevenue) {
        otherRevData = foundDeal.otherRevenue;
      } else {
        otherRevData = createDefaultOtherRevenueState();
      }
      
      setOtherRevenueState(otherRevData);
      setOriginalState(otherRevData);
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
  const getRoomsData = () => {
    if (!deal?.roomRevenue) {
      return {
        totalRoomsRevenue: 0,
        roomsAvailableYearTotal: 0
      };
    }

    return {
      totalRoomsRevenue: deal.roomRevenue.totals.roomsRevenue,
      roomsAvailableYearTotal: deal.roomRevenue.totals.roomsAvailable
    };
  };

  const handleSpaFieldChange = (field: keyof OtherRevenueState['spa'], value: number) => {
    if (!otherRevenueState) return;
    
    const newState = {
      ...otherRevenueState,
      spa: {
        ...otherRevenueState.spa,
        [field]: Math.max(0, value) // Prevent negatives
      }
    };
    
    setOtherRevenueState(newState);
    debouncedRecalculate();
  };

  const handleOtherModeChange = (mode: OtherRevenueMode) => {
    if (!otherRevenueState) return;
    
    const newState = {
      ...otherRevenueState,
      other: {
        ...otherRevenueState.other,
        mode
      }
    };
    
    setOtherRevenueState(newState);
    debouncedRecalculate();
  };

  const handleOtherFieldChange = (field: keyof OtherRevenueState['other'], value: number) => {
    if (!otherRevenueState) return;
    
    let clampedValue = Math.max(0, value);
    if (field === 'percentageOfRooms') {
      clampedValue = Math.min(100, clampedValue);
    }
    
    const newState = {
      ...otherRevenueState,
      other: {
        ...otherRevenueState.other,
        [field]: clampedValue
      }
    };
    
    setOtherRevenueState(newState);
    debouncedRecalculate();
  };

  const handleSave = async () => {
    if (!deal || !otherRevenueState) return;

    setSaveState('saving');
    
    try {
      const updatedDeal: Deal = {
        ...deal,
        otherRevenue: otherRevenueState,
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "otherRevenue", true);
      setOriginalState(otherRevenueState);
      
      setSaveState('success');
      toast.success("Other revenue saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save other revenue");
    }
  };

  const handleCancel = () => {
    if (originalState) {
      setOtherRevenueState(originalState);
      toast.info("Changes discarded");
    }
  };

  // Facility validation helpers
  const getFacilityWarnings = () => {
    if (!deal || !otherRevenueState) return [];
    
    const warnings = [];
    
    // Use normalized facilities if available, fallback to amenities
    const facilities = Array.isArray(deal.facilities) ? deal.facilities : [];
    const hasSpa = facilities.includes('Spa') || deal.amenities?.spa;
    const hasParking = facilities.includes('Parking') || deal.amenities?.parking;
    const hasMeetingsEvents = facilities.includes('Meeting & Events') || deal.amenities?.meetingsEvents;
    
    // Check spa facility vs spa revenue inputs
    if (!hasSpa) {
      const hasSpaRevenue = otherRevenueState.spa.treatmentsPerDay > 0 || 
                           otherRevenueState.spa.avgPricePerTreatment > 0;
      if (hasSpaRevenue) {
        warnings.push({
          type: 'warning' as const,
          message: 'Spa not enabled in Facilities. Please confirm whether Spa revenue should apply.',
          section: 'spa'
        });
      }
    }
    
    // Check parking facility vs other revenue
    if (!hasParking && otherRevenueState.other.mode === 'percentage' && otherRevenueState.other.percentageOfRooms > 0) {
      warnings.push({
        type: 'info' as const,
        message: 'Parking not enabled in Facilities. If Parking revenue is included in Other, please confirm.',
        section: 'parking'
      });
    }
    
    // Check meeting & events facility vs other revenue
    if (!hasMeetingsEvents) {
      const hasOtherRevenue = (otherRevenueState.other.mode === 'percentage' && otherRevenueState.other.percentageOfRooms > 0) ||
                             (otherRevenueState.other.mode === 'fixed' && otherRevenueState.other.monthlyFixed > 0);
      if (hasOtherRevenue) {
        warnings.push({
          type: 'info' as const,
          message: 'Meeting & Events not enabled in Facilities. Please confirm whether event revenue should apply.',
          section: 'events'
        });
      }
    }
    
    return warnings;
  };

  const facilityWarnings = getFacilityWarnings();

  if (!deal || !otherRevenueState) {
    return <div>Loading...</div>;
  }

  const rooms = getTotalRooms(deal);
  
  if (rooms === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Other Revenue</h3>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                Add rooms in Property Details to model other revenue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roomsData = getRoomsData();
  const results = calculateOtherRevenue(otherRevenueState, roomsData);

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  // Chart data
  const chartData = [
    {
      name: 'Spa Revenue',
      value: Math.round(results.spaRevenue)
    },
    {
      name: 'Other Revenue',
      value: Math.round(results.otherRevenue)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Other Revenue</h3>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-blue-800 text-sm font-medium">
            Configure ancillary revenues such as spa, parking, and miscellaneous services.
          </p>
        </div>
      </div>

      {/* Facility Validation Warnings */}
      {facilityWarnings.length > 0 && (
        <div className="space-y-3">
          {facilityWarnings.map((warning, index) => (
            <div key={index} className={`rounded-lg border p-4 ${
              warning.type === 'warning' 
                ? 'border-amber-200 bg-amber-50' 
                : 'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-start space-x-2">
                {warning.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <InfoIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium text-sm ${
                    warning.type === 'warning' ? 'text-amber-800' : 'text-blue-800'
                  }`}>
                    {warning.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    warning.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
                  }`}>
                    Update facilities in Property Details to resolve this {warning.type === 'warning' ? 'warning' : 'notice'}.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${getAnimationClass('kpis')}`}>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Total Spa Revenue</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.spaRevenue, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Total Other Revenue</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.otherRevenue, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Combined Ancillary Revenue</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.totalAncillary, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Ancillary RevPAR</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.ancillaryRevPAR, deal.currency)}
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <Accordion type="multiple" defaultValue={["spa", "other"]} className="space-y-4">
        {/* Section 1: Spa Revenue */}
        <AccordionItem value="spa" className="border border-slate-200 rounded-lg bg-white">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <span className="text-base font-semibold text-slate-900">Spa Revenue</span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Average Treatments per Day
                  </label>
                  <input
                    type="number"
                    value={otherRevenueState.spa.treatmentsPerDay || ''}
                    onChange={(e) => handleSpaFieldChange('treatmentsPerDay', Number(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Average Price per Treatment
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">€</span>
                    <input
                      type="number"
                      value={otherRevenueState.spa.avgPricePerTreatment || ''}
                      onChange={(e) => handleSpaFieldChange('avgPricePerTreatment', Number(e.target.value) || 0)}
                      className="w-32 pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-600 italic">
                  <strong>Benchmarks:</strong> 3–6 treatments/day per 30–40 room property, €50–90 average spend.
                </p>
              </div>
              
              <div className="border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600 mb-1">Calculation:</div>
                <div className="text-sm font-medium text-slate-900">
                  {otherRevenueState.spa.treatmentsPerDay} treatments/day × 365 days × €{otherRevenueState.spa.avgPricePerTreatment} = 
                  <span className="text-brand-600 font-semibold ml-1">
                    {formatCurrency(results.spaRevenue, deal.currency)}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Other Revenue */}
        <AccordionItem value="other" className="border border-slate-200 rounded-lg bg-white">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <span className="text-base font-semibold text-slate-900">Other Revenue</span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-6">
              {/* Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Revenue Model
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="otherMode"
                      value="percentage"
                      checked={otherRevenueState.other.mode === "percentage"}
                      onChange={() => handleOtherModeChange("percentage")}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900">% of Rooms Revenue</span>
                      <p className="text-xs text-slate-500">Calculate as percentage of total rooms revenue</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="otherMode"
                      value="fixed"
                      checked={otherRevenueState.other.mode === "fixed"}
                      onChange={() => handleOtherModeChange("fixed")}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900">Monthly Fixed Input (€)</span>
                      <p className="text-xs text-slate-500">Enter fixed monthly revenue amount</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mode-specific inputs */}
              {otherRevenueState.other.mode === "percentage" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    % of Rooms Revenue
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={otherRevenueState.other.percentageOfRooms || ''}
                      onChange={(e) => handleOtherFieldChange('percentageOfRooms', Number(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                  </div>
                  <div className="mt-2 bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 italic">
                      <strong>Typical range:</strong> 3–8% of Rooms Revenue depending on facilities (parking, laundry, etc.).
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Revenue
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">€</span>
                    <input
                      type="number"
                      value={otherRevenueState.other.monthlyFixed || ''}
                      onChange={(e) => handleOtherFieldChange('monthlyFixed', Number(e.target.value) || 0)}
                      className="w-40 pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      min="0"
                    />
                  </div>
                </div>
              )}
              
              <div className="border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600 mb-1">Calculation:</div>
                <div className="text-sm font-medium text-slate-900">
                  {otherRevenueState.other.mode === "percentage" ? (
                    <>
                      {formatCurrency(roomsData.totalRoomsRevenue, deal.currency)} × {otherRevenueState.other.percentageOfRooms}% = 
                      <span className="text-brand-600 font-semibold ml-1">
                        {formatCurrency(results.otherRevenue, deal.currency)}
                      </span>
                    </>
                  ) : (
                    <>
                      €{otherRevenueState.other.monthlyFixed.toLocaleString()} × 12 months = 
                      <span className="text-brand-600 font-semibold ml-1">
                        {formatCurrency(results.otherRevenue, deal.currency)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Chart */}
      <Card className={`border-slate-200 ${getAnimationClass('chart')}`}>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Ancillary Revenue Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
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
                        <p className="text-sm text-brand-600">
                          {formatCurrency(payload[0].value as number, deal.currency)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#14b8a6" name="Annual Revenue" />
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