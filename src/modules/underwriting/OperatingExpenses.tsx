import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Info, RotateCcw, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useToast } from '../../components/ui/toast';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { getTotalRooms } from '../../lib/rooms';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { OpexState, OpexItem } from '../../types/opex';
import { calculateOpexResults, getDriverLabel, RevenueData } from '../../lib/opexCalc';
import { createDefaultOpexState } from '../../data/opexDefaults';
import { calcAdvanced } from '../../lib/payrollCalc';
import BenchmarkMeter from '../../components/BenchmarkMeter';
import { computeAdvancedAnnual } from '../../lib/fnbCalc';
import { calculateOtherRevenue } from '../../lib/otherRevenueCalc';

interface OperatingExpensesProps {
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

export default function OperatingExpenses({ dealId, onSaved }: OperatingExpensesProps) {
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [opexState, setOpexState] = useState<OpexState | null>(null);
  const [originalState, setOriginalState] = useState<OpexState | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());

  // Load deal and opex state
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      let opexData: OpexState;
      if (foundDeal.operatingExpenses) {
        opexData = foundDeal.operatingExpenses;
      } else {
        opexData = createDefaultOpexState();
      }
      
      setOpexState(opexData);
      setOriginalState(opexData);
    }
  }, [dealId]);

  const animateFields = useCallback((fields: string[]) => {
    setAnimatedFields(new Set(fields));
    setTimeout(() => setAnimatedFields(new Set()), 1000);
  }, []);

  const debouncedRecalculate = useCallback(
    debounce(() => {
      animateFields(['kpis', 'totals']);
    }, 200),
    [animateFields]
  );

  // Get revenue data from deal
  const getRevenueData = (): RevenueData => {
    const roomsRevenue = deal?.roomRevenue?.totals.roomsRevenue || 0;
    const fnbRevenue = deal?.fnbRevenue ? (() => {
      // Calculate F&B revenue if available
      if (deal.roomRevenue) {
        const roomsSelectors = {
          roomsAvailableByMonth: deal.roomRevenue.months.map(m => m.roomsAvailable),
          roomsSoldByMonth: deal.roomRevenue.months.map(m => m.roomsSold),
          roomsAvailableYearTotal: deal.roomRevenue.totals.roomsAvailable,
          roomsSoldYearTotal: deal.roomRevenue.totals.roomsSold
        };
        
        // Import and use F&B calculation
        try {
          const results = computeAdvancedAnnual(deal.fnbRevenue, roomsSelectors);
          return results.totalFnb;
        } catch {
          return 0;
        }
      }
      return 0;
    })() : 0;
    
    const otherRevenue = deal?.otherRevenue ? (() => {
      // Calculate other revenue if available
      try {
        const roomsData = {
          totalRoomsRevenue: roomsRevenue,
          roomsAvailableYearTotal: deal?.roomRevenue?.totals.roomsAvailable || 0
        };
        const results = calculateOtherRevenue(deal.otherRevenue, roomsData);
        return results.totalAncillary;
      } catch {
        return 0;
      }
    })() : 0;

    const totalRevenue = roomsRevenue + fnbRevenue + otherRevenue;
    const roomsSoldByMonth = deal?.roomRevenue?.months.map(m => m.roomsSold) || Array(12).fill(0);
    const roomsSoldYearTotal = deal?.roomRevenue?.totals.roomsSold || 0;

    return {
      totalRoomsRevenue: roomsRevenue,
      totalFnbRevenue: fnbRevenue,
      totalOtherRevenue: otherRevenue,
      totalRevenue,
      roomsSoldByMonth,
      roomsSoldYearTotal
    };
  };

  const handleItemChange = (itemId: string, value: number) => {
    if (!opexState) return;
    
    const newState = {
      ...opexState,
      items: opexState.items.map(item => 
        item.id === itemId 
          ? { ...item, value: Math.max(0, value) } // Prevent negatives
          : item
      )
    };
    
    setOpexState(newState);
    debouncedRecalculate();
  };

  const handleRestoreDefaults = () => {
    const defaultState = createDefaultOpexState();
    setOpexState(defaultState);
    animateFields(['all-items', 'kpis', 'totals']);
    toast.success("Restored to default values");
  };

  const handleSave = async () => {
    if (!deal || !opexState) return;

    setSaveState('saving');
    
    try {
      // Save to Supabase first
      await persistToBackend("Operating Expenses");
      
      // Then update local storage
      const updatedDeal: Deal = {
        ...deal,
        operatingExpenses: opexState,
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "operatingCosts", true);
      setOriginalState(opexState);
      
      setSaveState('success');
      toast.success("Operating expenses saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save operating expenses");
    }
  };

  const handleCancel = () => {
    if (originalState) {
      setOpexState(originalState);
      toast.info("Changes discarded");
    }
  };

  if (!deal || !opexState) {
    return <div>Loading...</div>;
  }

  const rooms = getTotalRooms(deal);
  
  if (rooms === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Operating Expenses</h3>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                Complete Room Revenue setup to model operating expenses.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const revenueData = getRevenueData();
  const results = calculateOpexResults(opexState, revenueData);

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) || animatedFields.has('all-items') 
      ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'DIRECT': return 'bg-green-50 border-green-200';
      case 'INDIRECT': return 'bg-blue-50 border-blue-200';
      case 'OTHER': return 'bg-purple-50 border-purple-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getSectionItems = (section: string) => {
    return opexState.items.filter(item => item.section === section);
  };

  const renderSection = (section: 'DIRECT' | 'INDIRECT' | 'OTHER', title: string) => {
    const items = getSectionItems(section);
    const sectionTotal = results.bySection[section];
    
    return (
      <Card key={section} className="border-slate-200">
        <CardHeader className={`${getSectionColor(section)} rounded-t-lg`}>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{title}</span>
            <span className="text-sm font-medium">
              {formatCurrency(sectionTotal, deal.currency)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">Cost Item</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700 text-sm">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">Calculation Method</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700 text-sm">Annual Total</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">Benchmark</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const annualAmount = results.byItem[item.id] || 0;
                  
                  return (
                    <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50 ${getAnimationClass(item.id)}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-slate-900">{item.label}</span>
                          {item.tooltip && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-slate-600">
                                    <HelpCircle className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">{item.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative inline-block">
                          {item.unit === "€" && (
                            <span className="absolute left-2 top-1 text-slate-500 text-sm">€</span>
                          )}
                          <input
                            type="number"
                            value={item.value || ''}
                            onChange={(e) => handleItemChange(item.id, Number(e.target.value) || 0)}
                            className={`w-24 px-2 py-1 border border-slate-300 rounded text-right text-sm ${
                              item.unit === "€" ? 'pl-6' : ''
                            }`}
                            min="0"
                            step={item.unit === "€" ? "1" : "0.1"}
                          />
                          {item.unit === "%" && (
                            <span className="absolute right-2 top-1 text-slate-500 text-sm">%</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <select 
                            disabled 
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                            title="Driver editing will be enabled in a future update. Using default driver for now."
                          >
                            <option>{getDriverLabel(item.driver)}</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium text-slate-900">
                          {formatCurrency(annualAmount, deal.currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.benchmark && (
                          <BenchmarkMeter
                            label={item.label}
                            currentValue={item.value}
                            target={item.benchmark.target}
                            min={item.benchmark.min}
                            max={item.benchmark.max}
                            unit={item.benchmark.unit}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Operating Expenses</h3>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-blue-800 text-sm font-medium">
              USALI-compliant operating cost structure with departmental and undistributed expenses.
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestoreDefaults}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Restore Defaults</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${getAnimationClass('kpis')}`}>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Direct Costs</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.directTotal, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Indirect Costs</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.indirectTotal, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Other Costs</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.otherTotal, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Total Operating Expenses</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.grandTotal, deal.currency)}
          </div>
        </div>
      </div>

      {/* Cost Sections */}
      <div className="space-y-6">
        {renderSection('DIRECT', 'Direct Costs')}
        {renderSection('INDIRECT', 'Indirect Costs')}
        {renderSection('OTHER', 'Other Costs')}
      </div>

      {/* Payroll Block (Read-only) */}
      <Card className="border-slate-200 bg-slate-50/50">
        <CardHeader>
          <CardTitle className="text-base text-slate-700">Payroll Costs (from Payroll tab)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              // Get payroll data from deal
              const payrollData = deal?.payrollModel;
              if (!payrollData) {
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Direct Rooms</span>
                        <span className="font-medium text-slate-900">€0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Direct F&B</span>
                        <span className="font-medium text-slate-900">€0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Direct Wellness</span>
                        <span className="font-medium text-slate-900">€0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">A&G</span>
                        <span className="font-medium text-slate-900">€0</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sales & Marketing</span>
                        <span className="font-medium text-slate-900">€0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Maintenance</span>
                        <span className="font-medium text-slate-900">€0</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="text-slate-700 font-medium">Total Payroll Costs</span>
                        <span className="font-semibold text-slate-900">€0</span>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Calculate payroll totals by department
              try {
                const results = calcAdvanced(payrollData.advanced, rooms);
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Direct Rooms</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(results.byDepartment.rooms.total, deal.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Direct F&B</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(results.byDepartment.fnb.total, deal.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Direct Wellness</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(results.byDepartment.wellness.total, deal.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">A&G</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(results.byDepartment.ag.total, deal.currency)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sales & Marketing</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(results.byDepartment.sales.total, deal.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Maintenance</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(results.byDepartment.maintenance.total, deal.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="text-slate-700 font-medium">Total Payroll Costs</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(results.totalAnnual, deal.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              } catch (error) {
                return (
                  <div className="text-center text-slate-500 text-sm">
                    Configure payroll in the Payroll tab to see totals here
                  </div>
                );
              }
            })()}
            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-500 italic">
                Payroll costs are calculated in the Payroll tab and included automatically. They can't be edited here.
              </p>
            </div>
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