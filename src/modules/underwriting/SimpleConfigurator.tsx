import React, { useState, useEffect } from "react";
import { Info, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../components/ui/tooltip";
import { BudgetTooltip } from "../../components/BudgetTooltip";
import { BudgetTooltipKey } from "../../config/budgetTooltips";
import { Deal, DealBudget } from "../../types/deal";
import { totalRooms } from "../../lib/rooms";
import { formatCurrency, formatPresetSublabel, formatPresetCalculation } from "../../lib/formatters";

type Props = {
  deal: Deal;
  budget: DealBudget;
  onChange: (next: Partial<DealBudget>) => void;
  onSave: () => void;
  onCancel: () => void;
  onSwitchDetailed?: () => void;
};

type PresetLevel = 'low' | 'mid' | 'high' | null;

// Preset values
const PRESETS = {
  construction: { low: 500, mid: 2000, high: 4000 }, // per sqm
  ffe: { low: 5000, mid: 12500, high: 40000 }, // per room
  profFees: { low: 5, mid: 10, high: 15 }, // percentage
  contingency: { low: 5, mid: 10, high: 15 } // percentage
};

function PresetCard({ 
  title, 
  helper, 
  tooltipKey,
  presets, 
  type,
  selectedLevel, 
  onSelect, 
  disabled = false, 
  disabledReason = '',
  liveTotal,
  multiplier,
  currency,
  calculation
}: {
  title: string;
  helper: string;
  tooltipKey: BudgetTooltipKey;
  presets: { low: number; mid: number; high: number };
  type: 'perSqm' | 'perRoom' | 'percent';
  selectedLevel: PresetLevel;
  onSelect: (level: 'low' | 'mid' | 'high') => void;
  disabled?: boolean;
  disabledReason?: string;
  liveTotal: number;
  multiplier: number;
  currency: string;
  calculation: string;
}) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setPulseKey(prev => prev + 1);
  }, [liveTotal]);

  return (
    <div className={`rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 p-5 shadow-card hover:shadow-lg transition-all duration-300 ${
      disabled ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500">{helper}</p>
        </div>
        <BudgetTooltip keyId={tooltipKey} />
      </div>

      {disabled && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">{disabledReason}</p>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        {(['low', 'mid', 'high'] as const).map((level) => {
          const isSelected = selectedLevel === level;
          const value = presets[level];
          
          return (
            <button
              key={level}
              onClick={() => !disabled && onSelect(level)}
              disabled={disabled}
              className={`flex-1 px-4 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                isSelected
                  ? 'bg-gradient-to-r from-brand-500 to-primary-500 text-white shadow-lg hover:shadow-xl'
                  : disabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-brand-300 hover:shadow-md hover:bg-gradient-to-r hover:from-brand-50 hover:to-accent-50'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold capitalize">{level}</div>
                <div className={`text-xs mt-1 ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                  {formatPresetSublabel(type, value, currency)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-100 rounded-lg p-3">
        <div className="text-sm text-slate-600 mb-1">Live calculation:</div>
        <div 
          key={pulseKey}
          className="text-lg font-bold text-slate-900 animate-pulse"
          style={{ animationDuration: '0.6s', animationIterationCount: '1' }}
        >
          {calculation} = <span className="text-brand-600">{formatCurrency(liveTotal, currency)}</span>
        </div>
      </div>
    </div>
  );
}

export default function SimpleConfigurator({
  deal, 
  budget, 
  onChange, 
  onSave, 
  onCancel, 
  onSwitchDetailed
}: Props) {
  const rooms = totalRooms(deal.roomTypes);
  const sqm = deal.gfaSqm;

  // Determine current preset selections based on budget values
  const getCurrentPresetLevel = (category: keyof typeof PRESETS, currentValue: number, baseValue: number): PresetLevel => {
    if (baseValue === 0) return null;
    
    const rate = currentValue / baseValue;
    const presets = PRESETS[category];
    
    // 1% tolerance for matching
    const tolerance = 0.01;
    
    if (Math.abs(rate - presets.low) / presets.low <= tolerance) return 'low';
    if (Math.abs(rate - presets.mid) / presets.mid <= tolerance) return 'mid';
    if (Math.abs(rate - presets.high) / presets.high <= tolerance) return 'high';
    
    return null; // Custom value
  };

  const getPercentagePresetLevel = (category: keyof typeof PRESETS, currentPct: number): PresetLevel => {
    const presets = PRESETS[category];
    const tolerance = 0.5; // 0.5% tolerance for percentages
    
    if (Math.abs(currentPct - presets.low) <= tolerance) return 'low';
    if (Math.abs(currentPct - presets.mid) <= tolerance) return 'mid';
    if (Math.abs(currentPct - presets.high) <= tolerance) return 'high';
    
    return null;
  };

  const constructionLevel = getCurrentPresetLevel('construction', budget.constructionCosts, sqm);
  const ffeLevel = getCurrentPresetLevel('ffe', budget.ffeOse, rooms);
  const profFeesLevel = getPercentagePresetLevel('profFees', 
    budget.constructionSubtotal > 0 ? (budget.professionalFees / budget.constructionSubtotal) * 100 : 0
  );
  const contingencyLevel = getPercentagePresetLevel('contingency', budget.contingencyPct);

  const handleConstructionSelect = (level: 'low' | 'mid' | 'high') => {
    const rate = PRESETS.construction[level];
    const newValue = rate * sqm;
    onChange({ constructionCosts: newValue });
  };

  const handleFfeSelect = (level: 'low' | 'mid' | 'high') => {
    const rate = PRESETS.ffe[level];
    const newValue = rate * rooms;
    onChange({ ffeOse: newValue });
  };

  const handleProfFeesSelect = (level: 'low' | 'mid' | 'high') => {
    const pct = PRESETS.profFees[level];
    const constructionSubtotal = budget.constructionCosts + budget.ffeOse;
    const newValue = (pct / 100) * constructionSubtotal;
    onChange({ professionalFees: newValue });
  };

  const handleContingencySelect = (level: 'low' | 'mid' | 'high') => {
    const pct = PRESETS.contingency[level];
    onChange({ contingencyPct: pct });
  };

  const formatPerUnit = (total: number, unit: number) => {
    return unit > 0 ? formatCurrency(total / unit) : '–';
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center">
        <p className="text-lg text-slate-600 font-medium">
          Quick presets for non-experts. Switch to Detailed any time—everything stays in sync.
        </p>
      </div>
      
      {/* Preset Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <PresetCard
          title="Construction Costs"
          helper="Applies per sqm to 2.1 Construction Costs"
          tooltipKey="construction"
          presets={PRESETS.construction}
          type="perSqm"
          selectedLevel={constructionLevel}
          onSelect={handleConstructionSelect}
          disabled={sqm <= 0}
          disabledReason="Enter GFA in Property Details"
          liveTotal={budget.constructionCosts}
          calculation={`€${PRESETS.construction[constructionLevel || 'mid'].toLocaleString()} × ${sqm.toLocaleString()} sqm`}
          multiplier={deal.gfaSqm}
          currency={deal.currency}
        />
        
        <PresetCard
          title="FF&E + OS&E"
          helper="Applies per room to 2.2 FF&E and OS&E"
          tooltipKey="ffe"
          presets={PRESETS.ffe}
          type="perRoom"
          selectedLevel={ffeLevel}
          onSelect={handleFfeSelect}
          disabled={rooms <= 0}
          disabledReason="Add Room Types in Property Details"
          liveTotal={budget.ffeOse}
          calculation={`€${PRESETS.ffe[ffeLevel || 'mid'].toLocaleString()} × ${rooms} rooms`}
          multiplier={rooms}
          currency={deal.currency}
        />
        
        <PresetCard
          title="Professional Fees"
          helper="% of Section 2 (Construction Subtotal)"
          tooltipKey="profFees"
          presets={PRESETS.profFees}
          type="percent"
          selectedLevel={profFeesLevel}
          multiplier={budget.constructionSubtotal}
          onSelect={handleProfFeesSelect}
          disabled={false}
          liveTotal={budget.professionalFees}
          calculation={`${PRESETS.profFees[profFeesLevel || 'mid']}% × ${formatCurrency(budget.constructionSubtotal, deal.currency)}`}
          currency={deal.currency}
        />
        
        <PresetCard
          title="Contingency"
          helper="% of total (Sections 1–5)"
          tooltipKey="contingency"
          presets={PRESETS.contingency}
          type="percent"
          selectedLevel={contingencyLevel}
          multiplier={budget.siteAcquisition + budget.constructionSubtotal + budget.developmentSubtotal + budget.otherDevSubtotal + budget.preOpeningSubtotal}
          onSelect={handleContingencySelect}
          disabled={false}
          liveTotal={budget.contingencyAmount}
          calculation={`${PRESETS.contingency[contingencyLevel || 'mid']}% × ${formatCurrency(budget.siteAcquisition + budget.constructionSubtotal + budget.developmentSubtotal + budget.otherDevSubtotal + budget.preOpeningSubtotal, deal.currency)}`}
          currency={deal.currency}
        />
      </div>
      
      {/* Summary Panel */}
      <div className="sticky bottom-0 mt-8 p-6 bg-gradient-to-r from-white via-slate-50 to-white border-2 border-slate-200 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="text-center mb-6">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
            GRAND TOTAL excl. VAT
          </h3>
          <div className="text-4xl font-black text-slate-900 animate-pulse">
            {formatCurrency(budget.grandTotal, deal.currency)}
          </div>
          <div className="flex justify-center space-x-6 mt-3">
            <div className="text-sm">
              <span className="text-slate-500">Per room:</span>
              <span className="font-medium text-slate-900">
                {rooms > 0 ? formatCurrency(budget.grandTotal / rooms, deal.currency) : '–'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Per sqm:</span>
              <span className="font-medium text-slate-900">
                {deal.gfaSqm > 0 ? formatCurrency(budget.grandTotal / deal.gfaSqm, deal.currency) : '–'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onSave}
            className="flex-1 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold py-3"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Save Budget
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-2 border-slate-300 hover:border-slate-400"
          >
            Cancel
          </Button>
          {onSwitchDetailed && (
            <Button
              variant="ghost"
              onClick={onSwitchDetailed}
              className="text-slate-600 hover:text-slate-900"
            >
              View Detailed Table
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}