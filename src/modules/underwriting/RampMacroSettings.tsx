import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Info, Settings } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useToast } from '../../components/ui/toast';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { RampSettings, RampCurve } from '../../types/ramp';
import { revenueRampPresets, costRampPresets, createDefaultRampSettings } from '../../data/rampDefaults';
import RampCard from '../../components/RampCard';
import LabelCheck from '../../components/LabelCheck';

interface RampMacroSettingsProps {
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

type RampPresetKey = 'conservative' | 'standard' | 'ambitious';

function QuickButton({ 
  value, 
  active, 
  onClick 
}: { 
  value: number; 
  active: boolean; 
  onClick: () => void; 
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
      {value}%
    </button>
  );
}

export default function RampMacroSettings({ dealId, onSaved }: RampMacroSettingsProps) {
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [rampSettings, setRampSettings] = useState<RampSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<RampSettings | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());

  // Load deal and ramp settings
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      let rampData: RampSettings;
      if (foundDeal.assumptions?.rampSettings) {
        rampData = foundDeal.assumptions.rampSettings as RampSettings;
      } else {
        rampData = createDefaultRampSettings();
      }
      
      setRampSettings(rampData);
      setOriginalSettings(rampData);
    }
  }, [dealId]);

  const animateFields = useCallback((fields: string[]) => {
    setAnimatedFields(new Set(fields));
    setTimeout(() => setAnimatedFields(new Set()), 1000);
  }, []);

  const debouncedRecalculate = useCallback(
    debounce(() => {
      animateFields(['summary', 'preview']);
    }, 200),
    [animateFields]
  );

  const handleRevenueRampSelect = (preset: RampPresetKey) => {
    if (!rampSettings) return;
    
    const newSettings = {
      ...rampSettings,
      revenueRamp: revenueRampPresets[preset]
    };
    
    setRampSettings(newSettings);
    debouncedRecalculate();
  };

  const handleCostRampSelect = (preset: RampPresetKey) => {
    if (!rampSettings) return;
    
    const newSettings = {
      ...rampSettings,
      costRamp: costRampPresets[preset]
    };
    
    setRampSettings(newSettings);
    debouncedRecalculate();
  };

  const handleCostRampToggle = (group: keyof RampSettings['applyCostRamp'], enabled: boolean) => {
    if (!rampSettings || group === 'exclude') return;
    
    const newSettings = {
      ...rampSettings,
      applyCostRamp: {
        ...rampSettings.applyCostRamp,
        [group]: enabled
      }
    };
    
    setRampSettings(newSettings);
    debouncedRecalculate();
  };

  const handleMacroChange = (field: keyof RampSettings, value: number) => {
    if (!rampSettings) return;
    
    const newSettings = {
      ...rampSettings,
      [field]: value
    };
    
    setRampSettings(newSettings);
    debouncedRecalculate();
  };

  const handleSave = async () => {
    if (!deal || !rampSettings) return;

    setSaveState('saving');
    
    try {
      const updatedDeal: Deal = {
        ...deal,
        assumptions: {
          ...deal.assumptions,
          rampSettings
        },
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "rampSettings" as any, true);
      setOriginalSettings(rampSettings);
      
      setSaveState('success');
      toast.success("Ramp & macro settings saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save settings");
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setRampSettings(originalSettings);
      toast.info("Changes discarded");
    }
  };

  if (!deal || !rampSettings) {
    return <div>Loading...</div>;
  }

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  // Get current preset selections
  const getCurrentRevenuePreset = (): RampPresetKey | 'custom' => {
    for (const [key, preset] of Object.entries(revenueRampPresets)) {
      if (JSON.stringify(preset) === JSON.stringify(rampSettings.revenueRamp)) {
        return key as RampPresetKey;
      }
    }
    return 'custom';
  };

  const getCurrentCostPreset = (): RampPresetKey | 'custom' => {
    for (const [key, preset] of Object.entries(costRampPresets)) {
      if (JSON.stringify(preset) === JSON.stringify(rampSettings.costRamp)) {
        return key as RampPresetKey;
      }
    }
    return 'custom';
  };

  const currentRevenuePreset = getCurrentRevenuePreset();
  const currentCostPreset = getCurrentCostPreset();

  // Get Grand Total from Investment Budget for depreciation calculation
  const grandTotalCapexExVat = deal.budget?.grandTotal || 0;
  const annualDepreciation = (rampSettings.depreciationPctOfCapex / 100) * grandTotalCapexExVat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Ramp-up, Growth, Inflation & Other Settings</h3>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-blue-800 text-sm font-medium">
            Configure revenue and cost ramp-up curves for Years 1-4, plus long-term growth and inflation assumptions.
          </p>
        </div>
      </div>

      {/* Revenue Ramp-up Scenarios */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Revenue Ramp-up Scenarios</h3>
            <p className="text-xs text-slate-600 mt-1">
              Revenue ramp applies to all topline streams (Rooms, F&B, Other) during the first 4 years.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            <RampCard 
              title="Conservative" 
              subtitle="Slower ramp to stabilization"
              series={[70, 80, 90, 100]} 
              active={currentRevenuePreset === 'conservative'}
              onSelect={() => handleRevenueRampSelect('conservative')} 
              color="green" 
            />
            <RampCard 
              title="Standard" 
              subtitle="Balanced ramp-up approach"
              series={[80, 90, 100, 100]} 
              active={currentRevenuePreset === 'standard'}
              onSelect={() => handleRevenueRampSelect('standard')} 
              color="green" 
            />
            <RampCard 
              title="Ambitious" 
              subtitle="Faster path to stabilization"
              series={[85, 100, 100, 100]} 
              active={currentRevenuePreset === 'ambitious'}
              onSelect={() => handleRevenueRampSelect('ambitious')} 
              color="green" 
            />
          </div>
        </div>
      </div>

      {/* Operating Cost Ramp-up Scenarios */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Operating Cost Ramp-up Scenarios</h3>
            <p className="text-xs text-slate-600 mt-1">
              {"Cost ramp is a premium multiplier vs stabilized costs (>1 in Y1/Y2) applied to selected cost groups."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            <RampCard 
              title="Conservative" 
              subtitle="Higher initial cost premium"
              series={[115, 110, 100, 100]} 
              active={currentCostPreset === 'conservative'}
              onSelect={() => handleCostRampSelect('conservative')} 
              color="orange" 
              scale={{ min: 100, max: 120 }}
            />
            <RampCard 
              title="Standard" 
              subtitle="Moderate cost premium"
              series={[110, 105, 100, 100]} 
              active={currentCostPreset === 'standard'}
              onSelect={() => handleCostRampSelect('standard')} 
              color="orange" 
              scale={{ min: 100, max: 120 }}
            />
            <RampCard 
              title="Ambitious" 
              subtitle="Lower initial cost premium"
              series={[108, 102, 100, 100]} 
              active={currentCostPreset === 'ambitious'}
              onSelect={() => handleCostRampSelect('ambitious')} 
              color="orange" 
              scale={{ min: 100, max: 120 }}
            />
          </div>

          {/* Cost Group Toggles */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Apply Cost Ramp To:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <LabelCheck
                checked={rampSettings.applyCostRamp.departmental}
                onChange={(v) => handleCostRampToggle('departmental', v)}
                title="Departmental Costs"
                hint="Rooms, F&B, Other direct costs (COGS, commissions)"
              />
              <LabelCheck
                checked={rampSettings.applyCostRamp.otherOpex}
                onChange={(v) => handleCostRampToggle('otherOpex', v)}
                title="Other Operating Expenses"
                hint="Management fees, insurance, taxes"
              />
              <LabelCheck
                checked={rampSettings.applyCostRamp.undistributed}
                onChange={(v) => handleCostRampToggle('undistributed', v)}
                title="Undistributed Costs"
                hint="A&G, S&M, Maintenance, Utilities, Tech"
              />
              <LabelCheck
                checked={rampSettings.applyCostRamp.payroll}
                onChange={(v) => handleCostRampToggle('payroll', v)}
                title="Payroll Costs"
                hint="Apply premium to all payroll totals"
              />
            </div>
            <div className="mt-3 text-xs text-slate-500 border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
              <strong>Always excluded from ramp:</strong> Depreciation, Interest, CapEx, Rent
            </div>
          </div>
        </div>
      </div>

      {/* Macro Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Topline Growth */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">Topline Growth</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Applies from stabilized year onward to all revenue streams (Rooms, F&B, Other).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Annual Growth Rate
              </label>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="number"
                    value={rampSettings.toplineGrowthPct || ''}
                    onChange={(e) => handleMacroChange('toplineGrowthPct', Number(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    max="20"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                </div>
                <div className="flex space-x-2">
                  {[2, 3, 4, 5, 6].map((pct) => (
                    <QuickButton
                      key={pct}
                      value={pct}
                      active={rampSettings.toplineGrowthPct === pct}
                      onClick={() => handleMacroChange('toplineGrowthPct', pct)}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Applies to revenue streams from stabilized year onward
              </p>
            </div>
          </div>
        </div>

        {/* Inflation */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-900">Inflation</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      Applies to payroll and operating costs from stabilized year onward.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Annual Inflation Rate
              </label>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="number"
                    value={rampSettings.inflationPct || ''}
                    onChange={(e) => handleMacroChange('inflationPct', Number(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    max="15"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((pct) => (
                    <QuickButton
                      key={pct}
                      value={pct}
                      active={rampSettings.inflationPct === pct}
                      onClick={() => handleMacroChange('inflationPct', pct)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Depreciation */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Depreciation</h3>
          
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-600 mb-2">Calculation:</div>
            <div className="text-sm font-medium text-slate-900">
              Annual Depreciation = {rampSettings.depreciationPctOfCapex}% × {formatCurrency(grandTotalCapexExVat, deal.currency)} = 
              <span className="text-brand-600 font-semibold ml-1">
                {formatCurrency(annualDepreciation, deal.currency)}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Depreciation % of CapEx
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="number"
                  value={rampSettings.depreciationPctOfCapex || ''}
                  onChange={(e) => handleMacroChange('depreciationPctOfCapex', Number(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  min="0"
                  max="10"
                  step="0.1"
                />
                <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
              </div>
              <span className="text-sm text-slate-600">
                of Grand Total excl. VAT from Investment Budget
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Summary */}
      <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${getAnimationClass('summary')}`}>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Selected Summary</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Revenue Ramp (Y1-Y4)</div>
                <div className="flex space-x-2">
                  {rampSettings.revenueRamp.map((val, i) => (
                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      Y{i + 1}: {Math.round(val * 100)}%
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Cost Ramp (Y1-Y4)</div>
                <div className="flex space-x-2">
                  {rampSettings.costRamp.map((val, i) => (
                    <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                      Y{i + 1}: {Math.round(val * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Topline Growth:</span>
                <span className="font-medium text-slate-900">{rampSettings.toplineGrowthPct}% annually</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Inflation:</span>
                <span className="font-medium text-slate-900">{rampSettings.inflationPct}% annually</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Annual Depreciation:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(annualDepreciation, deal.currency)}
                </span>
              </div>
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
            {saveState === 'idle' && 'Save Settings'}
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