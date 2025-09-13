import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Info, DollarSign, Calculator, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useToast } from '../../components/ui/toast';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { totalRooms } from '../../lib/rooms';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { FinancingSettings, InvestmentOrder } from '../../types/financing';
import { createDefaultFinancingSettings, ltcPresets, interestRatePresets, loanTermPresets } from '../../data/financingDefaults';
import { buildDebtSchedule, calculateFinancingAmounts } from '../../lib/debt';

interface FinancingStructureProps {
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
  suffix = ''
}: { 
  value: number; 
  active: boolean; 
  onClick: () => void;
  suffix?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-sm font-medium transition-all ${
        active
          ? 'bg-brand-500 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {value}{suffix}
    </button>
  );
}

export default function FinancingStructure({ dealId, onSaved }: FinancingStructureProps) {
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [financingSettings, setFinancingSettings] = useState<FinancingSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<FinancingSettings | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());

  // Load deal and financing settings
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      let financingData: FinancingSettings;
      if (foundDeal.assumptions?.financingSettings) {
        financingData = foundDeal.assumptions.financingSettings as FinancingSettings;
      } else {
        financingData = createDefaultFinancingSettings();
      }
      
      setFinancingSettings(financingData);
      setOriginalSettings(financingData);
    }
  }, [dealId]);

  const animateFields = useCallback((fields: string[]) => {
    setAnimatedFields(new Set(fields));
    setTimeout(() => setAnimatedFields(new Set()), 1000);
  }, []);

  const debouncedRecalculate = useCallback(
    debounce(() => {
      animateFields(['financing-structure', 'debt-service']);
    }, 200),
    [animateFields]
  );

  const handleFieldChange = (field: keyof FinancingSettings, value: number | string) => {
    if (!financingSettings) return;
    
    const newSettings = {
      ...financingSettings,
      [field]: value
    };
    
    setFinancingSettings(newSettings);
    debouncedRecalculate();
  };

  const handleSave = async () => {
    if (!deal || !financingSettings) return;

    setSaveState('saving');
    
    try {
      const updatedDeal: Deal = {
        ...deal,
        assumptions: {
          ...deal.assumptions,
          financingSettings
        },
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "financingStructure" as any, true);
      setOriginalSettings(financingSettings);
      
      setSaveState('success');
      toast.success("Financing structure saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save financing structure");
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setFinancingSettings(originalSettings);
      toast.info("Changes discarded");
    }
  };

  if (!deal || !financingSettings) {
    return <div>Loading...</div>;
  }

  const rooms = totalRooms(deal.roomTypes);
  const projectCost = deal.budget?.grandTotal || 0;
  
  if (projectCost === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Financing Structure</h3>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                Complete Investment Budget to configure financing structure.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { loanAmount, equityRequired } = calculateFinancingAmounts(projectCost, financingSettings.ltcPct);
  const debtSchedule = buildDebtSchedule(financingSettings, projectCost);

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Financing Structure</h3>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-blue-800 text-sm font-medium">
            Configure debt financing, loan terms, and tax assumptions for your hotel investment.
          </p>
        </div>
      </div>

      {/* Project Cost Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Total Project Cost</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(projectCost, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Cost per Room</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(rooms > 0 ? projectCost / rooms : 0, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Cost per sqm</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(deal.gfaSqm > 0 ? projectCost / deal.gfaSqm : 0, deal.currency)}
          </div>
        </div>
      </div>

      {/* Financing Structure */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Financing Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <label className="block text-sm font-medium text-slate-700">
                LTC Ratio (Loan-to-Cost)
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Percentage of total project cost financed with debt.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative">
                <input
                  type="number"
                  value={financingSettings.ltcPct || ''}
                  onChange={(e) => handleFieldChange('ltcPct', Number(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  min="0"
                  max="100"
                  step="1"
                />
                <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
              </div>
              <div className="flex space-x-2">
                {ltcPresets.map((pct) => (
                  <QuickButton
                    key={pct}
                    value={pct}
                    active={financingSettings.ltcPct === pct}
                    onClick={() => handleFieldChange('ltcPct', pct)}
                    suffix={pct === 0 ? '' : '%'}
                  />
                ))}
              </div>
            </div>
            {ltcPresets[0] === financingSettings.ltcPct && (
              <p className="text-xs text-slate-500">Full Equity financing selected</p>
            )}
          </div>

          {/* Calculated Financing Structure */}
          <div className={`border border-slate-200 rounded-lg p-4 bg-slate-50 ${getAnimationClass('financing-structure')}`}>
            <h4 className="font-medium text-slate-900 mb-3">Calculated Financing Structure</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Loan Amount:</span>
                <span className="font-medium text-slate-900">{formatCurrency(loanAmount, deal.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Equity Required:</span>
                <span className="font-medium text-slate-900">{formatCurrency(equityRequired, deal.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-700 font-medium">Total Project Cost:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(projectCost, deal.currency)}</span>
              </div>
            </div>
            
            {/* Financing Breakdown Bar */}
            <div className="mt-4">
              <div className="flex h-4 rounded-full overflow-hidden bg-slate-200">
                {financingSettings.ltcPct > 0 && (
                  <div 
                    className="bg-red-400 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${financingSettings.ltcPct}%` }}
                  >
                    {financingSettings.ltcPct > 15 ? 'Debt' : ''}
                  </div>
                )}
                {(100 - financingSettings.ltcPct) > 0 && (
                  <div 
                    className="bg-green-400 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${100 - financingSettings.ltcPct}%` }}
                  >
                    {(100 - financingSettings.ltcPct) > 15 ? 'Equity' : ''}
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Debt {financingSettings.ltcPct}%</span>
                <span>Equity {100 - financingSettings.ltcPct}%</span>
              </div>
            </div>
          </div>

          {/* Investment Order */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Investment Order
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="investmentOrder"
                  value="EQUITY_FIRST"
                  checked={financingSettings.investmentOrder === "EQUITY_FIRST"}
                  onChange={(e) => handleFieldChange('investmentOrder', e.target.value)}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">Equity First</span>
                  <p className="text-xs text-slate-500">Invest equity before drawing debt</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="investmentOrder"
                  value="LOAN_FIRST"
                  checked={financingSettings.investmentOrder === "LOAN_FIRST"}
                  onChange={(e) => handleFieldChange('investmentOrder', e.target.value)}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">Loan First</span>
                  <p className="text-xs text-slate-500">Draw loan first, then invest equity</p>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Terms & Conditions */}
      {financingSettings.ltcPct > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Loan Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Interest Rate
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">
                        Annual nominal interest rate for debt service calculations.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="number"
                    value={financingSettings.interestRatePct || ''}
                    onChange={(e) => handleFieldChange('interestRatePct', Number(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    max="20"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                </div>
                <div className="flex space-x-2">
                  {interestRatePresets.map((rate) => (
                    <QuickButton
                      key={rate}
                      value={rate}
                      active={financingSettings.interestRatePct === rate}
                      onClick={() => handleFieldChange('interestRatePct', rate)}
                      suffix="%"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Loan Term (years)
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          Total contractual term of the loan.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={financingSettings.loanTermYears || ''}
                    onChange={(e) => handleFieldChange('loanTermYears', Number(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="1"
                    max="50"
                  />
                  <div className="flex space-x-2">
                    {loanTermPresets.map((term) => (
                      <QuickButton
                        key={term}
                        value={term}
                        active={financingSettings.loanTermYears === term}
                        onClick={() => handleFieldChange('loanTermYears', term)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Amortization Period (years)
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          Payment calculation period (may differ from loan term).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="number"
                  value={financingSettings.amortYears || ''}
                  onChange={(e) => handleFieldChange('amortYears', Number(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Interest-Only Period (years)
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">
                        During IO period: interest only, no principal amortization.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <input
                type="number"
                value={financingSettings.ioPeriodYears || ''}
                onChange={(e) => handleFieldChange('ioPeriodYears', Number(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                min="0"
                max="10"
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 italic">
                <strong>Note:</strong> Loan fees are managed in Investment Budget and included automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax Assumptions */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Tax Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Tax Rate on EBT
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Corporate tax applied to earnings before tax in P&L.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="number"
                  value={financingSettings.taxRateOnEBT || ''}
                  onChange={(e) => handleFieldChange('taxRateOnEBT', Number(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  min="0"
                  max="50"
                  step="0.1"
                />
                <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
              </div>
              <div className="flex space-x-2">
                {[20, 25, 30, 35].map((rate) => (
                  <QuickButton
                    key={rate}
                    value={rate}
                    active={financingSettings.taxRateOnEBT === rate}
                    onClick={() => handleFieldChange('taxRateOnEBT', rate)}
                    suffix="%"
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing Summary & Debt Service */}
      {financingSettings.ltcPct > 0 && (
        <Card className={`border-slate-200 ${getAnimationClass('debt-service')}`}>
          <CardHeader>
            <CardTitle className="text-base">Financing Summary & Debt Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
                <div className="text-sm font-medium text-navy-600">Monthly Payment (P&I)</div>
                <div className="mt-2 text-2xl font-semibold text-navy-900">
                  {formatCurrency(debtSchedule.monthlyPayment, deal.currency)}
                </div>
              </div>
              <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
                <div className="text-sm font-medium text-navy-600">Annual Debt Service</div>
                <div className="mt-2 text-2xl font-semibold text-navy-900">
                  {formatCurrency(debtSchedule.annualDebtService, deal.currency)}
                </div>
              </div>
              <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
                <div className="text-sm font-medium text-navy-600">Loan-to-Cost</div>
                <div className="mt-2 text-2xl font-semibold text-navy-900">
                  {financingSettings.ltcPct.toFixed(1)}%
                </div>
              </div>
              <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
                <div className="text-sm font-medium text-navy-600">Equity Required</div>
                <div className="mt-2 text-2xl font-semibold text-navy-900">
                  {formatCurrency(equityRequired, deal.currency)}
                </div>
              </div>
            </div>

            {/* Balloon Warning */}
            {debtSchedule.hasBalloon && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p className="text-amber-800 font-medium text-sm">
                    Balloon payment expected at maturity: {formatCurrency(debtSchedule.balloonPayment, deal.currency)}
                  </p>
                </div>
              </div>
            )}

            {/* Investment Flow & Timing */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`border border-slate-200 rounded-lg p-4 ${
                financingSettings.investmentOrder === 'EQUITY_FIRST' ? 'bg-brand-50 border-brand-300' : 'bg-slate-50'
              }`}>
                <h5 className="font-medium text-slate-900 mb-2">Equity-First Flow</h5>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>1) Invest Equity: {formatCurrency(equityRequired, deal.currency)}</div>
                  <div>2) Draw Loan: {formatCurrency(loanAmount, deal.currency)}</div>
                </div>
              </div>
              
              <div className={`border border-slate-200 rounded-lg p-4 ${
                financingSettings.investmentOrder === 'LOAN_FIRST' ? 'bg-brand-50 border-brand-300' : 'bg-slate-50'
              }`}>
                <h5 className="font-medium text-slate-900 mb-2">Loan-First Flow</h5>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>1) Draw Loan: {formatCurrency(loanAmount, deal.currency)}</div>
                  <div>2) Invest Equity: {formatCurrency(equityRequired, deal.currency)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
            {saveState === 'idle' && 'Save Financing'}
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