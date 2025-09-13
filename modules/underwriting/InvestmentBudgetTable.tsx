import { useState, useEffect, useCallback } from 'react';
import { Info, TrendingUp, Calculator, Table } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { useToast } from '../../components/ui/toast';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { getTotalRooms } from '../../lib/rooms';
import { formatCurrency } from '../../lib/utils';
import { Deal, DealBudget } from '../../types/deal';
import { budgetBenchmarks } from '../../data/constructionBenchmarks';
import BudgetBenchmarkBadge from '../../components/BudgetBenchmarkBadge';
import { BudgetTooltip } from '../../components/BudgetTooltip';
import { BudgetTooltipKey } from '../../config/budgetTooltips';
import { prefillBudgetMid } from '../../lib/budgetPrefill';
import { formatNumberWithThousandsSeparator } from '../../lib/utils';
import SimpleConfigurator from './SimpleConfigurator';

interface InvestmentBudgetTableProps {
  dealId: string;
  onSaved?: () => void;
}

// Helper to create empty budget from deal
function createEmptyBudget(deal: Deal): DealBudget {
  return {
    netPurchasePrice: deal.purchasePrice || 0,
    reTransferTax: 0,
    dealCosts: 0,
    siteAcquisition: 0,
    constructionCosts: 0,
    ffeOse: 0,
    constructionSubtotal: 0,
    professionalFees: 0,
    planningCharges: 0,
    developmentFee: 0,
    developmentSubtotal: 0,
    insuranceAdmin: 0,
    otherDev: 0,
    otherDevSubtotal: 0,
    preOpening: 0,
    preOpeningSubtotal: 0,
    contingencyPct: 10,
    contingencyAmount: 0,
    grandTotal: 0
  };
}

// Simple mode presets
const PRESETS = {
  constructionPerSqm: { low: 500, mid: 2000, high: 4000 },
  ffePerRoom: { low: 5000, mid: 12500, high: 40000 },
  profFeesPct: { low: 5, mid: 10, high: 15 },
  contingencyPct: { low: 5, mid: 10, high: 15 }
};

type PresetLevel = 'low' | 'mid' | 'high' | 'custom';
type SimpleSelection = {
  constructionPerSqm?: PresetLevel;
  ffePerRoom?: PresetLevel;
  profFeesPct?: PresetLevel;
  contingencyPct?: PresetLevel;
};

// Utility functions
function perSqmToTotal(rate: number, gfaSqm: number): number {
  return rate * gfaSqm;
}

function perRoomToTotal(rate: number, rooms: number): number {
  return rate * rooms;
}

function percentOf(value: number, pct: number): number {
  return (pct / 100) * value;
}

function approxEquals(a: number, b: number, tol = 0.01): boolean {
  return Math.abs(a - b) / Math.max(a, b, 1) <= tol;
}

function getPresetLevel(value: number, presets: Record<string, number>, totalOrBase?: number): PresetLevel {
  if (totalOrBase && totalOrBase > 0) {
    const rate = value / totalOrBase;
    if (approxEquals(rate, presets.low)) return 'low';
    if (approxEquals(rate, presets.mid)) return 'mid';
    if (approxEquals(rate, presets.high)) return 'high';
  } else {
    if (approxEquals(value, presets.low)) return 'low';
    if (approxEquals(value, presets.mid)) return 'mid';
    if (approxEquals(value, presets.high)) return 'high';
  }
  return 'custom';
}

// Calculate all computed values
function calculateBudget(budget: DealBudget): DealBudget {
  const siteAcquisition = budget.netPurchasePrice + budget.reTransferTax + budget.dealCosts;
  const constructionSubtotal = budget.constructionCosts + budget.ffeOse;
  const developmentSubtotal = budget.professionalFees + budget.planningCharges + budget.developmentFee;
  const otherDevSubtotal = budget.insuranceAdmin + budget.otherDev;
  const preOpeningSubtotal = budget.preOpening;
  
  const contingencyBase = siteAcquisition + constructionSubtotal + developmentSubtotal + otherDevSubtotal + preOpeningSubtotal;
  const contingencyAmount = (budget.contingencyPct / 100) * contingencyBase;
  const grandTotal = contingencyBase + contingencyAmount;

  return {
    ...budget,
    siteAcquisition,
    constructionSubtotal,
    developmentSubtotal,
    otherDevSubtotal,
    preOpeningSubtotal,
    contingencyAmount,
    grandTotal
  };
}

// Benchmark indicator component
function BenchmarkIndicator({ value, benchmark, unit }: { value: number; benchmark: any; unit: string }) {
  const { low, mid, high, label } = benchmark;
  const isPercent = (unit ?? '').includes('%');
  
  let position = 'low';
  if (value >= high) position = 'high';
  else if (value >= mid) position = 'mid';
  
  const fmt = (v: number) => (isPercent ? `${v}%` : formatCurrency(v, 'EUR'));

  const colors = {
    low: 'bg-green-100 text-green-700',
    mid: 'bg-yellow-100 text-yellow-700', 
    high: 'bg-red-100 text-red-700'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        <span className={`px-2 py-1 rounded text-xs font-medium ${position === 'low' ? colors.low : 'bg-slate-100 text-slate-600'}`}>
          {fmt(low)}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${position === 'mid' ? colors.mid : 'bg-slate-100 text-slate-600'}`}>
          {fmt(mid)}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${position === 'high' ? colors.high : 'bg-slate-100 text-slate-600'}`}>
          {fmt(high)}
        </span>
      </div>
      <span className="text-xs text-slate-500">{unit}</span>
    </div>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function InvestmentBudgetTable({ dealId, onSaved }: InvestmentBudgetTableProps) {
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [budget, setBudget] = useState<DealBudget | null>(null);
  const [originalBudget, setOriginalBudget] = useState<DealBudget | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());
  const [simpleMode, setSimpleMode] = useState<boolean>(true);
  const [simpleSelections, setSimpleSelections] = useState<SimpleSelection>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load deal and budget
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      let initialBudget: DealBudget;
      if (foundDeal.budget) {
        // Always sync net purchase price with deal.purchasePrice
        initialBudget = {
          ...foundDeal.budget,
          netPurchasePrice: foundDeal.purchasePrice || 0
        };
      } else {
        // Auto-prefill with baseline assumptions
        const rooms = getTotalRooms(foundDeal);
        initialBudget = prefillBudgetMid({
          rooms,
          gfaSqm: foundDeal.gfaSqm,
          purchasePrice: foundDeal.purchasePrice,
          starRating: foundDeal.stars,
          propertyType: foundDeal.propertyType
        });
        
        // Save the prefilled budget
        const updatedDeal = { ...foundDeal, budget: initialBudget, updatedAt: new Date().toISOString() };
        upsertDeal(updatedDeal);
        setDeal(updatedDeal);
        
        // Show toast notification
        toast.success("Baseline assumptions applied");
      }
      
      const calculatedBudget = calculateBudget(initialBudget);
      setBudget(calculatedBudget);
      setOriginalBudget(calculatedBudget);
      
      // Initialize simple selections based on current values
      const rooms = getTotalRooms(foundDeal);
      const sqm = foundDeal.gfaSqm;
      
      setSimpleSelections({
        constructionPerSqm: sqm > 0 ? getPresetLevel(calculatedBudget.constructionCosts, PRESETS.constructionPerSqm, sqm) : 'custom',
        ffePerRoom: rooms > 0 ? getPresetLevel(calculatedBudget.ffeOse, PRESETS.ffePerRoom, rooms) : 'custom',
        profFeesPct: getPresetLevel(calculatedBudget.professionalFees, PRESETS.profFeesPct),
        contingencyPct: getPresetLevel(calculatedBudget.contingencyPct, PRESETS.contingencyPct)
      });
    }
  }, [dealId]);

  // Debounced recalculation
  const debouncedRecalculate = useCallback(
    debounce((newBudget: DealBudget, changedField: string) => {
      const calculated = calculateBudget(newBudget);
      setBudget(calculated);
      
      // Animate changed field and affected totals
      const fieldsToAnimate = new Set([changedField]);
      if (changedField.startsWith('1.')) fieldsToAnimate.add('siteAcquisition');
      if (changedField.startsWith('2.')) fieldsToAnimate.add('constructionSubtotal');
      if (changedField.startsWith('3.')) fieldsToAnimate.add('developmentSubtotal');
      if (changedField.startsWith('4.')) fieldsToAnimate.add('otherDevSubtotal');
      if (changedField.startsWith('5.')) fieldsToAnimate.add('preOpeningSubtotal');
      fieldsToAnimate.add('contingencyAmount');
      fieldsToAnimate.add('grandTotal');
      
      setAnimatedFields(fieldsToAnimate);
      setTimeout(() => setAnimatedFields(new Set()), 1000);

      // If purchase price changed, trigger KPI update
      if (changedField === 'netPurchasePrice' && onSaved) {
        onSaved();
      }
    }, 200),
    [onSaved]
  );

  const handleSimplePreset = (category: keyof SimpleSelection, level: PresetLevel) => {
    if (!budget || !deal) return;
    
    const rooms = totalRooms(deal.roomTypes);
    const sqm = deal.gfaSqm;
    let newBudget = { ...budget };
    
    switch (category) {
      case 'constructionPerSqm':
        if (sqm > 0 && level !== 'custom') {
          newBudget.constructionCosts = perSqmToTotal(PRESETS.constructionPerSqm[level], sqm);
        }
        break;
      case 'ffePerRoom':
        if (rooms > 0 && level !== 'custom') {
          newBudget.ffeOse = perRoomToTotal(PRESETS.ffePerRoom[level], rooms);
        }
        break;
      case 'profFeesPct':
        if (level !== 'custom') {
          const constructionSubtotal = newBudget.constructionCosts + newBudget.ffeOse;
          newBudget.professionalFees = percentOf(constructionSubtotal, PRESETS.profFeesPct[level]);
        }
        break;
      case 'contingencyPct':
        if (level !== 'custom') {
          newBudget.contingencyPct = PRESETS.contingencyPct[level];
        }
        break;
    }
    
    // Update selections
    setSimpleSelections(prev => ({ ...prev, [category]: level }));
    
    // Recalculate and animate
    const calculated = calculateBudget(newBudget);
    setBudget(calculated);
    
    // Update deal purchase price if needed
    if (deal) {
      setDeal({ ...deal, purchasePrice: calculated.netPurchasePrice });
    }
    
    // Animate changes
    const fieldsToAnimate = new Set([category, 'grandTotal']);
    if (category === 'constructionPerSqm' || category === 'ffePerRoom') {
      fieldsToAnimate.add('constructionSubtotal');
      fieldsToAnimate.add('professionalFees'); // Professional fees depend on construction
    }
    fieldsToAnimate.add('contingencyAmount');
    
    setAnimatedFields(fieldsToAnimate);
    setTimeout(() => setAnimatedFields(new Set()), 1000);
    
    if (onSaved) {
      onSaved();
    }
  };

  const handleFieldChange = (field: keyof DealBudget, value: number) => {
    if (!budget) return;
    
    const newBudget = { ...budget, [field]: value };
    
    // If net purchase price changed, also update deal.purchasePrice to keep them in sync
    if (field === 'netPurchasePrice' && deal) {
      const updatedDeal = { ...deal, purchasePrice: value, updatedAt: new Date().toISOString() };
      setDeal(updatedDeal);
      // Save the updated purchase price to the deal immediately
      upsertDeal(updatedDeal);
    }
    
    debouncedRecalculate(newBudget, field);
    
    // Update simple selections based on new values
    if (deal) {
      const rooms = getTotalRooms(deal);
      const sqm = deal.gfaSqm;
      
      setSimpleSelections(prev => ({
        ...prev,
        constructionPerSqm: field === 'constructionCosts' && sqm > 0 ? 
          getPresetLevel(value, PRESETS.constructionPerSqm, sqm) : prev.constructionPerSqm,
        ffePerRoom: field === 'ffeOse' && rooms > 0 ? 
          getPresetLevel(value, PRESETS.ffePerRoom, rooms) : prev.ffePerRoom,
        profFeesPct: field === 'professionalFees' ? 
          getPresetLevel(value, PRESETS.profFeesPct) : prev.profFeesPct,
        contingencyPct: field === 'contingencyPct' ? 
          getPresetLevel(value, PRESETS.contingencyPct) : prev.contingencyPct
      }));
    }
  };

  const handleResetToBaseline = () => {
    if (!deal) return;
    
    const rooms = getTotalRooms(deal);
    const baselineBudget = prefillBudgetMid({
      rooms,
      gfaSqm: deal.gfaSqm,
      purchasePrice: deal.purchasePrice,
      starRating: deal.stars,
      propertyType: deal.propertyType
    });
    
    const calculatedBudget = calculateBudget(baselineBudget);
    setBudget(calculatedBudget);
    
    // Update deal purchase price if needed
    setDeal({ ...deal, purchasePrice: calculatedBudget.netPurchasePrice });
    
    // Reset simple selections to mid
    setSimpleSelections({
      constructionPerSqm: 'mid',
      ffePerRoom: 'mid',
      profFeesPct: 'mid',
      contingencyPct: 'mid'
    });
    
    // Animate changes
    const fieldsToAnimate = new Set([
      'netPurchasePrice', 'reTransferTax', 'dealCosts', 'siteAcquisition',
      'constructionCosts', 'ffeOse', 'constructionSubtotal',
      'professionalFees', 'planningCharges', 'developmentFee', 'developmentSubtotal',
      'insuranceAdmin', 'otherDev', 'otherDevSubtotal',
      'preOpening', 'preOpeningSubtotal',
      'contingencyPct', 'contingencyAmount', 'grandTotal'
    ]);
    
    setAnimatedFields(fieldsToAnimate);
    setTimeout(() => setAnimatedFields(new Set()), 1000);
    
    setShowResetConfirm(false);
    toast.success("Reset to baseline assumptions");
    
    if (onSaved) {
      onSaved();
    }
  };

  const handleSave = async () => {
    if (!deal || !budget) return;

    setSaveState('saving');
    
    try {
      const updatedDeal: Deal = {
        ...deal,
        purchasePrice: budget.netPurchasePrice, // Sync master purchase price
        budget: calculateBudget(budget),
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "investmentBudget", true);
      setOriginalBudget(budget);
      
      setSaveState('success');
      toast.success("Investment budget saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save budget");
    }
  };

  const handleCancel = () => {
    if (originalBudget && deal) {
      setBudget(originalBudget);
      setDeal({ ...deal, purchasePrice: originalBudget.netPurchasePrice });
      toast.info("Changes discarded");
    }
  };

  // Helper functions for benchmark integration
  const getBenchmarkLabel = (rowId: string): string => {
    switch (rowId) {
      case '2.1': return 'Construction Costs';
      case '2.2': return 'FF&E + OS&E';
      case '6.1': return 'Contingency';
      default: return '';
    }
  };

  const getBenchmarkData = (rowId: string) => {
    switch (rowId) {
      case '2.1': 
        return { low: 500, mid: 2000, high: 4000, unit: "per sqm" as const, source: "HF Baseline v1" };
      case '2.2': 
        return { low: 5000, mid: 12500, high: 40000, unit: "per room" as const, source: "HF Baseline v1" };
      case '6.1': 
        return { low: 5, mid: 10, high: 15, unit: "% of total" as const, source: "HF Baseline v1" };
      default: 
        return { low: 0, mid: 0, high: 0, unit: "per sqm" as const };
    }
  };

  const getCurrentUnitValue = (rowId: string, value: number, rooms: number, sqm: number): number => {
    switch (rowId) {
      case '2.1': 
        return sqm > 0 ? value / sqm : 0;
      case '2.2': 
        return rooms > 0 ? value / rooms : 0;
      case '6.1': 
        return value; // Already a percentage
      default: 
        return 0;
    }
  };

  if (!deal || !budget) {
    return <div>Loading...</div>;
  }

  const rooms = getTotalRooms(deal);
  const sqm = deal.gfaSqm;

  const formatPerUnit = (total: number, unit: number) => {
    return unit > 0 ? formatCurrency(total / unit, deal.currency) : '–';
  };

  const formatPercent = (total: number, grandTotal: number) => {
    return grandTotal > 0 ? `${((total / grandTotal) * 100).toFixed(1)}%` : '–';
  };

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  // Simple mode preset chip component
  const PresetChip = ({ 
    level, 
    label, 
    isSelected, 
    onClick, 
    disabled = false 
  }: { 
    level: PresetLevel; 
    label: string; 
    isSelected: boolean; 
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isSelected
          ? 'bg-brand-500 text-white shadow-md'
          : disabled
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  // Simple mode preset group component
  const PresetGroup = ({ 
    title, 
    helper, 
    category, 
    unit, 
    showTotal = false,
    disabled = false,
    disabledReason = ''
  }: { 
    title: string; 
    helper: string; 
    category: keyof SimpleSelection;
    unit?: string;
    showTotal?: boolean;
    disabled?: boolean;
    disabledReason?: string;
  }) => {
    const selected = simpleSelections[category] || 'custom';
    const presets = PRESETS[category as keyof typeof PRESETS];
    
    const getTotal = (level: PresetLevel) => {
      if (level === 'custom' || !presets || !deal) return 0;
      
      const rooms = totalRooms(deal.roomTypes);
      const sqm = deal.gfaSqm;
      
      switch (category) {
        case 'constructionPerSqm':
          return perSqmToTotal(presets[level], sqm);
        case 'ffePerRoom':
          return perRoomToTotal(presets[level], rooms);
        default:
          return presets[level];
      }
    };
    
    return (
      <div className="space-y-3">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-slate-900">{title}</h4>
            {disabled && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">{disabledReason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-sm text-slate-600">{helper}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(['low', 'mid', 'high'] as PresetLevel[]).map((level) => {
            const value = presets[level];
            const total = getTotal(level);
            
            return (
              <div key={level} className="flex flex-col items-center space-y-1">
                <PresetChip
                  level={level}
                  label={`${level.charAt(0).toUpperCase() + level.slice(1)} ${unit ? `${formatCurrency(value, deal?.currency)}${unit}` : `${value}%`}`}
                  isSelected={selected === level}
                  onClick={() => handleSimplePreset(category, level)}
                  disabled={disabled}
                />
                {showTotal && total > 0 && (
                  <span className="text-xs text-slate-500">
                    = {formatCurrency(total, deal?.currency)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const rows = [
    // Site Acquisition
    { id: '1.1', label: 'Net Purchase Price', field: 'netPurchasePrice' as keyof DealBudget, editable: true, tooltipKey: 'netPurchasePrice' as BudgetTooltipKey },
    { id: '1.2', label: 'Real Estate Transfer Tax', field: 'reTransferTax' as keyof DealBudget, editable: true, tooltipKey: 'realEstateTransferTax' as BudgetTooltipKey },
    { id: '1.3', label: 'Deal Costs', field: 'dealCosts' as keyof DealBudget, editable: true, tooltipKey: 'dealCosts' as BudgetTooltipKey },
    { id: '1', label: 'Site Acquisition', field: 'siteAcquisition' as keyof DealBudget, editable: false, subtotal: true, tooltipKey: 'siteAcquisitionSubtotal' as BudgetTooltipKey },

    // Construction Costs
    { id: '2.1', label: 'Construction Costs', field: 'constructionCosts' as keyof DealBudget, editable: true, benchmark: true, tooltipKey: 'construction' as BudgetTooltipKey },
    { id: '2.2', label: 'FF&E and OS&E', field: 'ffeOse' as keyof DealBudget, editable: true, benchmark: true, tooltipKey: 'ffe' as BudgetTooltipKey },
    { id: '2', label: 'Construction Costs', field: 'constructionSubtotal' as keyof DealBudget, editable: false, subtotal: true, tooltipKey: 'constructionSubtotal' as BudgetTooltipKey },

    // Development Costs
    { id: '3.1', label: 'Professional Fees', field: 'professionalFees' as keyof DealBudget, editable: true, tooltipKey: 'profFees' as BudgetTooltipKey },
    { id: '3.2', label: 'Planning and Municipality Charges', field: 'planningCharges' as keyof DealBudget, editable: true, tooltipKey: 'planningMunicipality' as BudgetTooltipKey },
    { id: '3.3', label: 'Development Fee', field: 'developmentFee' as keyof DealBudget, editable: true, tooltipKey: 'developmentFee' as BudgetTooltipKey },
    { id: '3', label: 'Development Costs', field: 'developmentSubtotal' as keyof DealBudget, editable: false, subtotal: true, tooltipKey: 'developmentSubtotal' as BudgetTooltipKey },

    // Other Development Costs
    { id: '4.1', label: 'Insurance & Admin Costs', field: 'insuranceAdmin' as keyof DealBudget, editable: true, tooltipKey: 'insuranceAdmin' as BudgetTooltipKey },
    { id: '4.2', label: 'Other', field: 'otherDev' as keyof DealBudget, editable: true, tooltipKey: 'otherDevCosts' as BudgetTooltipKey },
    { id: '4', label: 'Other Development Costs', field: 'otherDevSubtotal' as keyof DealBudget, editable: false, subtotal: true, tooltipKey: 'otherDevSubtotal' as BudgetTooltipKey },

    // Pre-opening
    { id: '5.1', label: 'Pre-opening Budget', field: 'preOpening' as keyof DealBudget, editable: true, tooltipKey: 'preOpeningBudget' as BudgetTooltipKey },
    { id: '5', label: 'Pre-opening costs', field: 'preOpeningSubtotal' as keyof DealBudget, editable: false, subtotal: true, tooltipKey: 'preOpeningSubtotal' as BudgetTooltipKey },

    // Contingency
    { id: '6.1', label: 'Contingency', field: 'contingencyPct' as keyof DealBudget, editable: true, isPercent: true, benchmark: true, tooltipKey: 'contingencyPercent' as BudgetTooltipKey },
    { id: '6', label: 'Contingency Budget', field: 'contingencyAmount' as keyof DealBudget, editable: false, subtotal: true, tooltipKey: 'contingencyBudget' as BudgetTooltipKey },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Investment Budget</h3>
          
          <div className="flex items-center space-x-4">
            {/* Reset to Baseline */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              Reset to baseline
            </button>
            
            {/* Mode Switch */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setSimpleMode(true)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  simpleMode
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={simpleMode}
              >
                Simple
              </button>
              <button
                onClick={() => setSimpleMode(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  !simpleMode
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={!simpleMode}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-600 mb-6">
          {simpleMode 
            ? 'Use preset buttons for quick budget estimates based on industry benchmarks.'
            : 'Build your complete investment budget with automatic calculations and industry benchmarks.'
          }
        </p>
      </div>

      {simpleMode ? (
        <SimpleConfigurator
          deal={deal}
          budget={budget}
          onChange={(changes) => {
            // Handle simple configurator changes
            const newBudget = { ...budget, ...changes };
            const calculated = calculateBudget(newBudget);
            setBudget(calculated);
            
            // Animate changes
            const fieldsToAnimate = new Set(Object.keys(changes));
            fieldsToAnimate.add('grandTotal');
            setAnimatedFields(fieldsToAnimate);
            setTimeout(() => setAnimatedFields(new Set()), 1000);
            
            if (onSaved) {
              onSaved();
            }
          }}
          onSave={handleSave}
          onCancel={handleCancel}
          onSwitchDetailed={() => setSimpleMode(false)}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Item</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700">Total ({deal.currency})</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700">Per room</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700">Per sqm</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700">% of total</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Benchmark</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const value = budget[row.field] as number;
                  const isGrandTotal = row.id === 'grandTotal';
                  
                  return (
                    <tr key={row.id} className={`border-b border-slate-100 ${row.subtotal ? 'bg-slate-50' : ''} ${getAnimationClass(row.field)}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`${row.subtotal ? 'font-semibold' : ''} text-slate-900`}>
                            {row.label}
                          </span>
                          {row.tooltipKey && <BudgetTooltip keyId={row.tooltipKey} />}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.editable ? (
                          <div className="flex justify-end">
                            {row.isPercent ? (
                              <div className="relative">
                                <input
                                  type="number"
                                  value={value || ''}
                                  onChange={(e) => handleFieldChange(row.field, Number(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border border-slate-300 rounded text-right"
                                  min="0"
                                  max="50"
                                />
                                <span className="absolute right-2 top-1 text-slate-500 pointer-events-none">%</span>
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(row.field, Number(e.target.value) || 0)}
                                className="w-32 px-2 py-1 border border-slate-300 rounded text-right"
                                min="0"
                              />
                            )}
                          </div>
                        ) : (
                          <span className={`${row.subtotal ? 'font-semibold' : ''} text-slate-900`}>
                            {row.isPercent ? `${value.toFixed(0)}%` : formatNumberWithThousandsSeparator(value)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {row.isPercent ? '–' : (rooms > 0 ? formatNumberWithThousandsSeparator(value / rooms) : '–')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {row.isPercent ? '–' : (sqm > 0 ? formatNumberWithThousandsSeparator(value / sqm) : '–')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {row.isPercent ? `${((value / budget.grandTotal) * 100).toFixed(0)}%` : '–'}
                      </td>
                      <td className="py-3 px-4">
                        {row.benchmark && budgetBenchmarks[row.id as keyof typeof budgetBenchmarks] && (
                          <BenchmarkIndicator
                            value={row.id === '2.1' ? value / sqm : row.id === '2.2' ? value / rooms : value}
                            benchmark={budgetBenchmarks[row.id as keyof typeof budgetBenchmarks]}
                            unit={budgetBenchmarks[row.id as keyof typeof budgetBenchmarks].unit}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Grand Total Row */}
                <tr className={`border-t-2 border-slate-300 bg-slate-100 ${getAnimationClass('grandTotal')}`}>
                  <td className="py-4 px-4">
                    <span className="text-lg font-bold text-slate-900">GRAND TOTAL excl. VAT</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-lg font-bold text-slate-900">
                      {budget.grandTotal.toLocaleString('en-US')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-slate-600 font-medium">
                    {rooms > 0 ? (budget.grandTotal / rooms).toLocaleString('en-US') : '–'}
                  </td>
                  <td className="py-4 px-4 text-right text-slate-600 font-medium">
                    {sqm > 0 ? (budget.grandTotal / sqm).toLocaleString('en-US') : '–'}
                  </td>
                  <td className="py-4 px-4 text-right text-slate-600 font-medium">100%</td>
                  <td className="py-4 px-4"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {rows.map((row) => {
              const value = budget[row.field] as number;
              
              return (
                <div key={row.id} className={`border border-slate-200 rounded-lg p-4 ${row.subtotal ? 'bg-slate-50' : 'bg-white'} ${getAnimationClass(row.field)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`${row.subtotal ? 'font-semibold' : ''} text-slate-900`}>
                        {row.label}
                      </span>
                      {row.tooltipKey && <BudgetTooltip keyId={row.tooltipKey} />}
                    </div>
                    {row.editable ? (
                      <>
                        <div className="flex justify-end">
                          {row.isPercent ? (
                            <div className="relative">
                              <input
                                type="number"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(row.field, Number(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border border-slate-300 rounded text-right"
                                min="0"
                                max="50"
                              />
                              <span className="absolute right-2 top-1 text-slate-500 pointer-events-none">%</span>
                            </div>
                          ) : (
                            <input
                              type="number"
                              value={value || ''}
                              onChange={(e) => handleFieldChange(row.field, Number(e.target.value) || 0)}
                              className="w-32 px-2 py-1 border border-slate-300 rounded text-right"
                              min="0"
                            />
                          )}
                        </div>
                        {row.benchmark && (
                          <div className="mt-2 flex justify-end">
                            <BudgetBenchmarkBadge
                              label={getBenchmarkLabel(row.id)}
                              benchmark={getBenchmarkData(row.id)}
                              currentValue={getCurrentUnitValue(row.id, value, rooms, sqm)}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className={`${row.subtotal ? 'font-semibold' : ''} text-slate-900`}>
                          {row.isPercent ? `${value}%` : value.toLocaleString('en-US')}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>Per room: {row.isPercent ? '–' : (rooms > 0 ? (value / rooms).toLocaleString('en-US') : '–')}</div>
                    <div>Per sqm: {row.isPercent ? '–' : (sqm > 0 ? (value / sqm).toLocaleString('en-US') : '–')}</div>
                    <div>% of total: {row.isPercent ? `${value}%` : (budget.grandTotal > 0 ? `${((value / budget.grandTotal) * 100).toFixed(1)}%` : '–')}</div>
                  </div>
                  
                  {row.benchmark && (
                    <div className="mt-3">
                      <BudgetBenchmarkBadge
                        label={getBenchmarkLabel(row.id)}
                        benchmark={getBenchmarkData(row.id)}
                        currentValue={getCurrentUnitValue(row.id, value, rooms, sqm)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Mobile Grand Total */}
            <div className={`border-2 border-slate-300 rounded-lg p-4 bg-slate-100 ${getAnimationClass('grandTotal')}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-slate-900">GRAND TOTAL excl. VAT</span>
                <span className="text-lg font-bold text-slate-900">
                  {budget.grandTotal.toLocaleString('en-US')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 font-medium">
                <div>Per room: {rooms > 0 ? (budget.grandTotal / rooms).toLocaleString('en-US') : '–'}</div>
                <div>Per sqm: {sqm > 0 ? (budget.grandTotal / sqm).toLocaleString('en-US') : '–'}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Reset to Baseline?</h3>
            <p className="text-slate-600 mb-6">
              This will replace all current budget values with baseline assumptions based on your property details. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetToBaseline}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reset to Baseline
              </Button>
            </div>
          </div>
        </div>
      )}

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