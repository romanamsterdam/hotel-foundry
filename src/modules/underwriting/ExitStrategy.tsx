import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Info, Target, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useToast } from '../../components/ui/toast';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { ExitSettings, ExitStrategy as ExitStrategyType } from '../../types/exitStrategy';
import { createDefaultExitSettings, exitYearPresets, capRatePresets, ltvPresets } from '../../data/exitDefaults';
import { calculateSaleSummary, calculateRefinanceSummary } from '../../lib/exitCalc';
import { computeProjectIrrsWithHorizon } from '../../lib/finance/cashflow';
import { formatIRR } from '../../lib/finance/irr';

interface ExitStrategyProps {
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

function QuickButton({ 
  value, 
  active, 
  onClick,
  suffix = '',
  disabled = false
}: { 
  value: number; 
  active: boolean; 
  onClick: () => void;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded text-sm font-medium transition-all ${
        active
          ? 'bg-brand-500 text-white shadow-sm'
          : disabled
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {value}{suffix}
    </button>
  );
}

function StrategyCard({
  strategy,
  title,
  description,
  active,
  onSelect
}: {
  strategy: ExitStrategyType;
  title: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
        active
          ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-50'
          : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-md'
      }`}
      aria-pressed={active}
    >
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </button>
  );
}

export default function ExitStrategy({ dealId, onSaved }: ExitStrategyProps) {
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [exitSettings, setExitSettings] = useState<ExitSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<ExitSettings | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());

  // Load deal and exit settings
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      let exitData: ExitSettings;
      if (foundDeal.assumptions?.exitSettings) {
        exitData = foundDeal.assumptions.exitSettings as ExitSettings;
      } else {
        exitData = createDefaultExitSettings();
      }
      
      setExitSettings(exitData);
      setOriginalSettings(exitData);
    }
  }, [dealId]);

  const animateFields = useCallback((fields: string[]) => {
    setAnimatedFields(new Set(fields));
    setTimeout(() => setAnimatedFields(new Set()), 1000);
  }, []);

  const debouncedRecalculate = useCallback(
    debounce(() => {
      animateFields(['returns', 'summary']);
    }, 200),
    [animateFields]
  );

  const handleStrategyChange = (strategy: ExitStrategyType) => {
    if (!exitSettings) return;
    
    const newSettings = {
      ...exitSettings,
      strategy
    };
    
    setExitSettings(newSettings);
    debouncedRecalculate();
  };

  const handleSaleFieldChange = (field: keyof ExitSettings['sale'], value: number) => {
    if (!exitSettings) return;
    
    const newSettings = {
      ...exitSettings,
      sale: {
        ...exitSettings.sale,
        [field]: value
      }
    };
    
    setExitSettings(newSettings);
    debouncedRecalculate();
  };

  const handleRefinanceFieldChange = (field: keyof ExitSettings['refinance'], value: number) => {
    if (!exitSettings) return;
    
    const newSettings = {
      ...exitSettings,
      refinance: {
        ...exitSettings.refinance,
        [field]: value
      }
    };
    
    setExitSettings(newSettings);
    debouncedRecalculate();
  };

  const handleSave = async () => {
    if (!deal || !exitSettings) return;

    setSaveState('saving');
    
    try {
      const updatedDeal: Deal = {
        ...deal,
        assumptions: {
          ...deal.assumptions,
          exitSettings
        },
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "exitStrategy" as any, true);
      setOriginalSettings(exitSettings);
      
      setSaveState('success');
      toast.success("Exit strategy saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save exit strategy");
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setExitSettings(originalSettings);
      toast.info("Changes discarded");
    }
  };

  if (!deal || !exitSettings) {
    return <div>Loading...</div>;
  }

  const projectCost = deal.budget?.grandTotal || 0;
  
  // Get real IRRs from cash flow calculations
  const exitYear = exitSettings.strategy === 'SALE' ? exitSettings.sale.exitYear :
                   exitSettings.strategy === 'REFINANCE' ? exitSettings.refinance.refinanceYear : 10;
  const { unleveredIrr, leveredIrr } = computeProjectIrrsWithHorizon(dealId, { throughYearIndex: exitYear });
  
  // Calculate development profit from sale/refinance summary
  const developmentProfit = exitSettings.strategy === 'SALE' ? 
    calculateSaleSummary(exitSettings, projectCost, dealId).developmentProfit :
    exitSettings.strategy === 'REFINANCE' ?
    calculateRefinanceSummary(exitSettings, projectCost, dealId).netCashOut :
    0;

  // Helper function to assess return quality
  const assessReturn = (value: number, type: 'irr' | 'profit') => {
    if (type === 'irr') {
      const pct = value * 100; // Convert to percentage
      if (pct < 8) return { quality: 'Very Poor', color: 'text-red-600' };
      if (pct < 12) return { quality: 'Below Average', color: 'text-orange-600' };
      if (pct < 18) return { quality: 'Good', color: 'text-green-600' };
      if (pct < 25) return { quality: 'Excellent', color: 'text-emerald-600' };
      return { quality: 'Outstanding', color: 'text-emerald-700' };
    } else {
      // Development profit as % of project cost
      const profitMargin = projectCost > 0 ? (value / projectCost) * 100 : 0;
      if (profitMargin < 10) return { quality: 'Very Poor', color: 'text-red-600' };
      if (profitMargin < 20) return { quality: 'Below Average', color: 'text-orange-600' };
      if (profitMargin < 35) return { quality: 'Good', color: 'text-green-600' };
      if (profitMargin < 50) return { quality: 'Excellent', color: 'text-emerald-600' };
      return { quality: 'Outstanding', color: 'text-emerald-700' };
    }
  };

  const leveredAssessment = assessReturn(leveredIrr || 0, 'irr');
  const unleveredAssessment = assessReturn(unleveredIrr || 0, 'irr');
  const profitAssessment = assessReturn(developmentProfit, 'profit');

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Exit Assumptions</span>
        </h3>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-blue-800 text-sm font-medium">
            Configure your exit strategy to calculate IRR, development profit, and investment returns.
          </p>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Exit Strategy</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StrategyCard
              strategy="HOLD_FOREVER"
              title="Hold Forever"
              description="Long-term cash flow strategy focused on asset appreciation"
              active={exitSettings.strategy === "HOLD_FOREVER"}
              onSelect={() => handleStrategyChange("HOLD_FOREVER")}
            />
            <StrategyCard
              strategy="SALE"
              title="Sale"
              description="Exit via sale at specific year and cap rate"
              active={exitSettings.strategy === "SALE"}
              onSelect={() => handleStrategyChange("SALE")}
            />
            <StrategyCard
              strategy="REFINANCE"
              title="Refinance"
              description="Extract equity while maintaining ownership"
              active={exitSettings.strategy === "REFINANCE"}
              onSelect={() => handleStrategyChange("REFINANCE")}
            />
          </div>
        </div>
      </div>

      {/* Strategy-Specific Inputs */}
      {exitSettings.strategy === "SALE" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-slate-900">Sale Parameters</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Exit Year
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          The year when you plan to sell the property. Earlier exits may have lower returns due to ramp-up costs.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={exitSettings.sale.exitYear || ''}
                    onChange={(e) => handleSaleFieldChange('exitYear', Number(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="1"
                    max="20"
                  />
                  <div className="flex space-x-2">
                    {exitYearPresets.map((year) => (
                      <QuickButton
                        key={year}
                        value={year}
                        active={exitSettings.sale.exitYear === year}
                        onClick={() => handleSaleFieldChange('exitYear', year)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Exit Cap Rate
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs text-sm space-y-2">
                          <p className="font-semibold">Exit Cap Rate - Simple Explanation</p>
                          <p>This is how investors value hotels when buying them. Think of it like a "return rate" - lower cap rates mean the hotel is worth more money.</p>
                          <div className="border-t pt-2 space-y-1">
                            <p className="font-medium">Typical Benchmarks:</p>
                            <p>• 4-5%: Prime locations, very high valuations</p>
                            <p>• 5-6%: Good locations, strong valuations</p>
                            <p>• 6-7%: Average market valuations</p>
                           <p>• &gt;50%: Outstanding</p>
                            <p>• 8%+: Lower valuations, higher risk</p>
                          </div>
                          <p className="text-xs text-slate-500 italic">
                            Lower cap rate = Higher sale price. Example: €800k profit ÷ 6% = €13.3M vs ÷ 8% = €10M
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={exitSettings.sale.exitCapRate || ''}
                      onChange={(e) => handleSaleFieldChange('exitCapRate', Number(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      min="0"
                      max="20"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                  </div>
                  <div className="flex space-x-2">
                    {capRatePresets.map((rate) => (
                      <QuickButton
                        key={rate}
                        value={rate}
                        active={exitSettings.sale.exitCapRate === rate}
                        onClick={() => handleSaleFieldChange('exitCapRate', rate)}
                        suffix="%"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Selling Costs
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">
                        Transaction costs including broker fees, legal fees, and transfer taxes as percentage of sale price.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="number"
                    value={exitSettings.sale.sellingCostsPct || ''}
                    onChange={(e) => handleSaleFieldChange('sellingCostsPct', Number(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                </div>
                <div className="flex space-x-2">
                  {[2, 3, 4, 5].map((pct) => (
                    <QuickButton
                      key={pct}
                      value={pct}
                      active={exitSettings.sale.sellingCostsPct === pct}
                      onClick={() => handleSaleFieldChange('sellingCostsPct', pct)}
                      suffix="%"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sale Summary */}
            <div className={`border border-slate-200 rounded-lg p-4 bg-slate-50 ${getAnimationClass('summary')}`}>
              <h4 className="font-medium text-slate-900 mb-3">Estimated Sale Summary</h4>
              {(() => {
                const summary = calculateSaleSummary(exitSettings, projectCost, dealId);
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Reference Year EBITDA:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(summary.referenceEBITDA, deal.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Exit Cap Rate:</span>
                      <span className="font-medium text-slate-900">{summary.exitCapRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Estimated Sale Price:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(summary.estimatedSalePrice, deal.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Selling Costs:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(summary.sellingCosts, deal.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Net Sale Proceeds:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(summary.netSaleProceeds, deal.currency)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-600">Less: Total CapEx:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(summary.totalCapEx, deal.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Development Profit:</span>
                      <span className={`font-semibold ${summary.developmentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(summary.developmentProfit, deal.currency)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {exitSettings.strategy === "REFINANCE" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-slate-900">Refinance Parameters</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Refinance Year
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          The year when you plan to refinance the property to extract equity.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={exitSettings.refinance.refinanceYear || ''}
                    onChange={(e) => handleRefinanceFieldChange('refinanceYear', Number(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="1"
                    max="20"
                  />
                  <div className="flex space-x-2">
                    {exitYearPresets.map((year) => (
                      <QuickButton
                        key={year}
                        value={year}
                        active={exitSettings.refinance.refinanceYear === year}
                        onClick={() => handleRefinanceFieldChange('refinanceYear', year)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    LTV at Refinance
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          Loan-to-Value ratio for the new loan based on the property's appraised value at refinance.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={exitSettings.refinance.ltvAtRefinance || ''}
                      onChange={(e) => handleRefinanceFieldChange('ltvAtRefinance', Number(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      min="0"
                      max="90"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                  </div>
                  <div className="flex space-x-2">
                    {ltvPresets.map((ltv) => (
                      <QuickButton
                        key={ltv}
                        value={ltv}
                        active={exitSettings.refinance.ltvAtRefinance === ltv}
                        onClick={() => handleRefinanceFieldChange('ltvAtRefinance', ltv)}
                        suffix="%"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Refinance Costs
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">
                        Refinancing fees including appraisal, legal, and lender fees as percentage of new loan amount.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="number"
                    value={exitSettings.refinance.refinanceCostsPct || ''}
                    onChange={(e) => handleRefinanceFieldChange('refinanceCostsPct', Number(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map((pct) => (
                    <QuickButton
                      key={pct}
                      value={pct}
                      active={exitSettings.refinance.refinanceCostsPct === pct}
                      onClick={() => handleRefinanceFieldChange('refinanceCostsPct', pct)}
                      suffix="%"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Refinance Summary */}
            <div className={`border border-slate-200 rounded-lg p-4 bg-slate-50 ${getAnimationClass('summary')}`}>
              <h4 className="font-medium text-slate-900 mb-3">Estimated Refinance Summary</h4>
              {(() => {
                const summary = calculateRefinanceSummary(exitSettings, projectCost, dealId);
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Reference Year EBITDA:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(summary.referenceEBITDA, deal.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Refinance LTV:</span>
                      <span className="font-medium text-slate-900">{summary.refinanceLTV}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">New Loan Amount:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(summary.newLoanAmount, deal.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Refinance Costs:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(summary.refinanceCosts, deal.currency)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-700 font-medium">Net Cash Out:</span>
                      <span className="font-semibold text-brand-600">{formatCurrency(summary.netCashOut, deal.currency)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {exitSettings.strategy === "HOLD_FOREVER" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <p className="text-blue-800 font-medium text-sm">
                Long-term hold strategy focused on cash flow generation and asset appreciation over time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expected Returns Summary */}
      <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${getAnimationClass('returns')}`}>
        <div className="space-y-6">
          <h3 className="text-base font-semibold text-slate-900">Expected Returns Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-emerald-700">IRR (Levered)</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-emerald-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs text-sm space-y-2">
                        <p className="font-semibold">IRR (Levered) - Simple Explanation</p>
                        <p>This is your annual return percentage when using debt (loans) to finance part of the project. Think of it like interest on a savings account, but for your hotel investment.</p>
                        <div className="border-t pt-2 space-y-1">
                          <p className="font-medium">Typical Benchmarks:</p>
                          <p>• 8-12%: Below Average</p>
                          <p>• 12-18%: Good</p>
                          <p>• 18-25%: Excellent</p>
                          <p>• 25%+: Outstanding</p>
                        </div>
                        <p className={`font-semibold ${leveredAssessment.color}`}>
                          Your {leveredIrr ? `${(leveredIrr * 100).toFixed(1)}%` : 'N/A'} return is: {leveredAssessment.quality}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                {leveredIrr ? `${(leveredIrr * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>

            <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-purple-700">IRR (Unlevered)</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-purple-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs text-sm space-y-2">
                        <p className="font-semibold">IRR (Unlevered) - Simple Explanation</p>
                        <p>This is your annual return percentage if you paid 100% cash (no loans). It shows the pure property performance without debt effects.</p>
                        <div className="border-t pt-2 space-y-1">
                          <p className="font-medium">Typical Benchmarks:</p>
                          <p>• 6-10%: Below Average</p>
                          <p>• 10-15%: Good</p>
                          <p>• 15-20%: Excellent</p>
                          <p>• 20%+: Outstanding</p>
                        </div>
                        <p className={`font-semibold ${unleveredAssessment.color}`}>
                          Your {unleveredIrr ? `${(unleveredIrr * 100).toFixed(1)}%` : 'N/A'} return is: {unleveredAssessment.quality}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {unleveredIrr ? `${(unleveredIrr * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-blue-700">Development Profit</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs text-sm space-y-2">
                        <p className="font-semibold">Development Profit - Simple Explanation</p>
                        <p>This is the total money you make from the project. It's what you get back (from sale or refinance) minus what you put in.</p>
                        <div className="border-t pt-2 space-y-1">
                          <p className="font-medium">Typical Benchmarks (as % of investment):</p>
                          <p>• 10-20%: Below Average</p>
                          <p>• 20-35%: Good</p>
                          <p>• 35-50%: Excellent</p>
                          <p>• 50%+: Outstanding</p>
                        </div>
                        <p className={`font-semibold ${profitAssessment.color}`}>
                          Your profit margin is: {profitAssessment.quality}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(developmentProfit, deal.currency)}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 text-sm font-medium">
                IRR calculations will update dynamically once P&L and Cash Flow modules are complete.
              </p>
            </div>
          </div>
        </div>
      </div>

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
            {saveState === 'idle' && 'Save Exit Assumptions'}
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
