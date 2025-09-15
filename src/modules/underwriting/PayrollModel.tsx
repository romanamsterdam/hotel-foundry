import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Plus, Trash2, Users, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../components/ui/toast';
import { useProjectSave } from '../../lib/persist/ProjectSaveContext';
import { getDeal, upsertDeal } from '../../lib/dealStore';
import { setCompleted } from '../../lib/uwProgress';
import { getTotalRooms } from '../../lib/rooms';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { PayrollState, Role, DeptKey, ServiceLevel, CompStrategy } from '../../types/payroll';
import { calcAdvanced } from '../../lib/payrollCalc';
import { createDefaultPayrollState, serviceLevelMultipliers, compStrategyMultipliers } from '../../data/payrollDefaults';
import { simpleToAdvanced, advancedToSimple } from '../../lib/payrollSync';
import { useBenchmarks } from '../../lib/benchmarks/useBenchmarks';
import { SalaryBenchmarkHint } from '../../components/benchmarks/BenchmarkHint';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Info } from 'lucide-react';

interface PayrollModelProps {
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

const departmentLabels: Record<DeptKey, string> = {
  rooms: "Direct Payroll Rooms",
  fnb: "Direct Payroll F&B",
  wellness: "Direct Payroll Wellness",
  ag: "A&G Payroll",
  sales: "Sales & Marketing Payroll",
  maintenance: "Maintenance Payroll"
};

const serviceLevelLabels = {
  economy: "Economy (0.7x staffing)",
  midscale: "Midscale (0.85x staffing)",
  upscale: "Upscale (1.0x staffing)",
  luxury: "Luxury (1.3x staffing)"
};

const compStrategyLabels = {
  cost: "Cost Leader (0.8x salaries)",
  market: "Market Rate (1.0x salaries)",
  premium: "Premium (1.2x salaries)"
};

export default function PayrollModel({ dealId, onSaved }: PayrollModelProps) {
  const { toast } = useToast();
  const { saveNow } = useProjectSave();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [payrollState, setPayrollState] = useState<PayrollState | null>(null);
  const [originalState, setOriginalState] = useState<PayrollState | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [animatedFields, setAnimatedFields] = useState<Set<string>>(new Set());
  const [showApplyBanner, setShowApplyBanner] = useState(false);
  
  // Get country from deal for benchmarks
  const dealCountryCode = deal?.countryCode || 'PT';
  const benchmarks = useBenchmarks(dealCountryCode);

  // Load deal and payroll state
  useEffect(() => {
    const foundDeal = getDeal(dealId);
    if (foundDeal) {
      setDeal(foundDeal);
      
      const rooms = getTotalRooms(foundDeal);
      let payrollData: PayrollState;
      
      if (foundDeal.payrollModel) {
        payrollData = {
          ...foundDeal.payrollModel,
          simple: {
            ...foundDeal.payrollModel.simple,
            roomsCount: rooms, // Always sync with current room count
            countryCode: foundDeal.countryCode || foundDeal.payrollModel.simple.countryCode || 'PT'
          }
        };
      } else {
        payrollData = createDefaultPayrollState(rooms);
        // Set country from deal
        payrollData.simple.countryCode = foundDeal.countryCode || 'PT';
      }
      
      setPayrollState(payrollData);
      setOriginalState(payrollData);
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

  const handleModeToggle = (mode: "simple" | "advanced") => {
    if (!payrollState) return;
    
    if (mode === "simple") {
      // Advanced → Simple: derive simple values
      const derivedSimple = advancedToSimple(payrollState.advanced, payrollState.simple.roomsCount);
      setPayrollState({
        ...payrollState,
        mode: "simple",
        simple: derivedSimple
      });
    } else {
      // Simple → Advanced: keep existing advanced unless empty
      setPayrollState({
        ...payrollState,
        mode: "advanced"
      });
    }
    
    setShowApplyBanner(false);
    debouncedRecalculate();
  };

  const handleSimpleFieldChange = (field: keyof PayrollState['simple'], value: any) => {
    if (!payrollState) return;
    
    const newSimple = {
      ...payrollState.simple,
      [field]: value
    };
    
    // Regenerate advanced roles from simple
    const newAdvanced = simpleToAdvanced(newSimple, payrollState);
    
    const newState = {
      ...payrollState,
      simple: newSimple,
      advanced: newAdvanced
    };
    
    setPayrollState(newState);
    setShowApplyBanner(false);
    debouncedRecalculate();
  };

  const handleAdvancedRoleChange = (roleId: string, field: keyof Role, value: any) => {
    if (!payrollState) return;
    
    const newAdvanced = payrollState.advanced.map(role =>
      role.id === roleId ? { ...role, [field]: value } : role
    );
    
    // Derive simple from advanced
    const derivedSimple = advancedToSimple(newAdvanced, payrollState.simple.roomsCount);
    
    const newState = {
      ...payrollState,
      advanced: newAdvanced,
      simple: derivedSimple
    };
    
    setPayrollState(newState);
    setShowApplyBanner(true);
    debouncedRecalculate();
  };

  const handleAddRole = (dept: DeptKey) => {
    if (!payrollState) return;
    
    const newRole: Role = {
      id: crypto.randomUUID(),
      dept,
      title: "New Role",
      ftes: 1,
      baseSalary: payrollState.simple.baseReceptionSalary,
      employerCostPct: payrollState.simple.employerCostPct
    };
    
    const newAdvanced = [...payrollState.advanced, newRole];
    const derivedSimple = advancedToSimple(newAdvanced, payrollState.simple.roomsCount);
    
    setPayrollState({
      ...payrollState,
      advanced: newAdvanced,
      simple: derivedSimple
    });
    
    setShowApplyBanner(true);
    debouncedRecalculate();
  };

  const handleRemoveRole = (roleId: string) => {
    if (!payrollState) return;
    
    const newAdvanced = payrollState.advanced.filter(role => role.id !== roleId);
    const derivedSimple = advancedToSimple(newAdvanced, payrollState.simple.roomsCount);
    
    setPayrollState({
      ...payrollState,
      advanced: newAdvanced,
      simple: derivedSimple
    });
    
    setShowApplyBanner(true);
    debouncedRecalculate();
  };

  const handleApplySimpleToRoles = () => {
    if (!payrollState) return;
    
    const newAdvanced = simpleToAdvanced(payrollState.simple, payrollState);
    setPayrollState({
      ...payrollState,
      advanced: newAdvanced
    });
    
    setShowApplyBanner(false);
    toast.success("Simple values applied to roles");
    debouncedRecalculate();
  };

  const handleRestoreDefaults = () => {
    if (!deal) return;
    
    const rooms = getTotalRooms(deal);
    const defaultState = createDefaultPayrollState(rooms);
    setPayrollState(defaultState);
    setShowApplyBanner(false);
    animateFields(['all-roles', 'kpis', 'totals']);
    toast.success("Restored to default payroll structure");
  };

  const handleSave = async () => {
    if (!deal || !payrollState) return;

    setSaveState('saving');
    
    try {
      // Save to Supabase first
      await saveNow("Payroll Model");
      
      // Then update local storage
      const updatedDeal: Deal = {
        ...deal,
        payrollModel: payrollState,
        updatedAt: new Date().toISOString()
      };

      upsertDeal(updatedDeal);
      setCompleted(dealId, "payrollModel", true);
      setOriginalState(payrollState);
      
      setSaveState('success');
      toast.success("Payroll model saved");
      
      if (onSaved) {
        onSaved();
      }

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (error) {
      setSaveState('idle');
      toast.error("Failed to save payroll model");
    }
  };

  const handleCancel = () => {
    if (originalState) {
      setPayrollState(originalState);
      setShowApplyBanner(false);
      toast.info("Changes discarded");
    }
  };

  // Facility validation helpers
  const getFacilityWarnings = () => {
    if (!deal || !payrollState) return [];
    
    const warnings = [];
    
    // Use normalized facilities if available, fallback to amenities
    const facilities = Array.isArray(deal.facilities) ? deal.facilities : [];
    const hasSpa = facilities.includes('Spa') || deal.amenities?.spa;
    
    // Check spa facility vs wellness payroll
    if (!hasSpa) {
      const hasWellnessPayroll = payrollState.advanced.some(role => 
        role.dept === 'wellness' && (role.ftes > 0 || role.baseSalary > 0)
      );
      if (hasWellnessPayroll) {
        warnings.push({
          type: 'info' as const,
          message: 'Spa not enabled in Facilities. Wellness payroll may still apply for general wellness services.',
          section: 'wellness'
        });
      }
    }
    
    return warnings;
  };

  const facilityWarnings = getFacilityWarnings();

  if (!deal || !payrollState) {
    return <div>Loading...</div>;
  }

  const rooms = getTotalRooms(deal);
  
  if (rooms === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payroll Model</h3>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                Add rooms in Property Details to model payroll costs.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const results = calcAdvanced(payrollState.advanced, rooms);

  const getAnimationClass = (field: string) => {
    return animatedFields.has(field) || animatedFields.has('all-roles') 
      ? 'animate-pulse bg-brand-50 transition-all duration-500' : '';
  };

  const getDepartmentRoles = (dept: DeptKey) => {
    return payrollState.advanced.filter(role => role.dept === dept);
  };

  const renderDepartmentTable = (dept: DeptKey) => {
    const roles = getDepartmentRoles(dept);
    const deptTotal = results.byDepartment[dept].total;
    const deptFtes = results.byDepartment[dept].ftes;
    
    return (
      <Card key={dept} className="border-slate-200">
        <CardHeader className="bg-slate-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{departmentLabels[dept]}</CardTitle>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                {deptFtes.toFixed(1)} FTEs • {formatCurrency(deptTotal, deal.currency)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRole(dept)}
                className="flex items-center space-x-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add Role</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">Role Name</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700 text-sm">FTEs</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700 text-sm">Annual Salary (€/FTE)</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700 text-sm">Employer Cost %</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700 text-sm">Total Cost</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-700 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => {
                  const roleTotal = role.ftes * role.baseSalary * (1 + role.employerCostPct / 100);
                  
                  return (
                    <tr key={role.id} className={`border-b border-slate-100 hover:bg-slate-50 ${getAnimationClass(role.id)}`}>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={role.title}
                          onChange={(e) => handleAdvancedRoleChange(role.id, 'title', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={role.ftes || ''}
                          onChange={(e) => handleAdvancedRoleChange(role.id, 'ftes', Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                          min="0"
                          step="0.1"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-slate-500 text-sm">€</span>
                          <input
                            type="number"
                            value={role.baseSalary || ''}
                            onChange={(e) => handleAdvancedRoleChange(role.id, 'baseSalary', Number(e.target.value) || 0)}
                            className="w-28 pl-6 pr-2 py-1 border border-slate-300 rounded text-right text-sm"
                            min="0"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative">
                          <input
                            type="number"
                            value={role.employerCostPct || ''}
                            onChange={(e) => handleAdvancedRoleChange(role.id, 'employerCostPct', Number(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                            min="0"
                            max="50"
                          />
                          <span className="absolute right-2 top-1 text-slate-500 text-sm">%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium text-slate-900">
                          {formatCurrency(roleTotal, deal.currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRole(role.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Department Total Row */}
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td className="py-3 px-4 font-semibold text-slate-900">Department Total</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {deptFtes.toFixed(1)}
                  </td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {formatCurrency(deptTotal, deal.currency)}
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
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
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Payroll Model</h3>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-blue-800 text-sm font-medium">
              USALI-compliant payroll modeling with departmental breakdown and employer cost calculations.
            </p>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleModeToggle('simple')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
              payrollState.mode === 'simple'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => handleModeToggle('advanced')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
              payrollState.mode === 'advanced'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Facility Validation Warnings */}
      {facilityWarnings.length > 0 && (
        <div className="space-y-3">
          {facilityWarnings.map((warning, index) => (
            <div key={index} className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium text-sm">
                    Base Salary (Receptionist Level)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="ml-2 text-slate-400 hover:text-slate-600">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <SalaryBenchmarkHint countryCode={dealCountryCode} role="receptionist" />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="ml-2 text-slate-400 hover:text-slate-600">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            Country affects salary baselines and benchmarks. Defaults to property location.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    Update facilities in Property Details if needed.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Banner */}
      {showApplyBanner && payrollState.mode === 'advanced' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-amber-800 font-medium text-sm">
              Simple differs from current roles — Apply Simple to Roles
            </p>
            <Button
              size="sm"
              onClick={handleApplySimpleToRoles}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Apply Simple to Roles
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${getAnimationClass('kpis')}`}>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Total Annual Payroll</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.totalAnnual, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Monthly Payroll</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.monthlyPayroll, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Per Room (Annual)</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {formatCurrency(results.perRoomAnnual, deal.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card">
          <div className="text-sm font-medium text-navy-600">Total FTEs</div>
          <div className="mt-2 text-2xl font-semibold text-navy-900">
            {results.totalFtes.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Mode-specific Content */}
      {payrollState.mode === 'simple' ? (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Strategic Payroll Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service Level
                </label>
                <Select 
                  value={payrollState.simple.serviceLevel} 
                  onValueChange={(value) => handleSimpleFieldChange('serviceLevel', value as ServiceLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceLevelLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-slate-500">
                  Affects overall staffing levels relative to baseline
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Compensation Strategy
                </label>
                <Select 
                  value={payrollState.simple.compStrategy} 
                  onValueChange={(value) => handleSimpleFieldChange('compStrategy', value as CompStrategy)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(compStrategyLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-slate-500">
                  Affects salary levels relative to market rates
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country & Market
                </label>
                <Select 
                  value={payrollState.simple.countryCode} 
                  onValueChange={(value) => handleSimpleFieldChange('countryCode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AL">Albania</SelectItem>
                    <SelectItem value="HR">Croatia</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="GR">Greece</SelectItem>
                    <SelectItem value="IT">Italy</SelectItem>
                    <SelectItem value="NL">Netherlands</SelectItem>
                    <SelectItem value="HR">Croatia</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="GR">Greece</SelectItem>
                    <SelectItem value="IT">Italy</SelectItem>
                    <SelectItem value="NL">Netherlands</SelectItem>
                    <SelectItem value="PT">Portugal</SelectItem>
                    <SelectItem value="ES">Spain</SelectItem>
                    <SelectItem value="IT">Italy</SelectItem>
                    <SelectItem value="PH">Philippines</SelectItem>
                    <SelectItem value="NO">Norway</SelectItem>
                    <SelectItem value="MA">Morocco</SelectItem>
                    <SelectItem value="CH">Switzerland</SelectItem>
                    <SelectItem value="ID">Indonesia</SelectItem>
                    <SelectItem value="HR">Croatia</SelectItem>
                    <SelectItem value="GB">UK</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-slate-500">
                  Affects salary baselines and benchmarks
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Employer Cost Percentage
                </label>
                <div className="flex space-x-2 mb-2">
                  {[20, 25, 30, 35].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleSimpleFieldChange('employerCostPct', pct)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                        payrollState.simple.employerCostPct === pct
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={payrollState.simple.employerCostPct || ''}
                  onChange={(e) => handleSimpleFieldChange('employerCostPct', Number(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                  min="0"
                  max="50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Social security, benefits, and employer taxes
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Base Salary (Receptionist Level)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">€</span>
                  <input
                    type="number"
                    value={payrollState.simple.baseReceptionSalary || ''}
                    onChange={(e) => handleSimpleFieldChange('baseReceptionSalary', Number(e.target.value) || 0)}
                    className="w-32 pl-8 pr-3 py-2 border border-slate-300 rounded text-right"
                    min="0"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Anchor salary; other roles use multipliers
                </p>
              </div>
            </div>

            {/* Live Preview */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-medium text-slate-900 mb-4">Live Preview</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total FTEs:</span>
                    <span className="font-medium text-slate-900">{results.totalFtes.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Avg Cost/FTE:</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(results.totalFtes > 0 ? results.totalAnnual / results.totalFtes : 0, deal.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">FTEs per Room:</span>
                    <span className="font-medium text-slate-900">
                      {(results.totalFtes / rooms).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-slate-700">Sample Roles:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Receptionist:</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(payrollState.simple.baseReceptionSalary * compStrategyMultipliers[payrollState.simple.compStrategy], deal.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">F&B Manager:</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(payrollState.simple.baseReceptionSalary * 1.6 * compStrategyMultipliers[payrollState.simple.compStrategy], deal.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Hotel Manager:</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(payrollState.simple.baseReceptionSalary * 3.25 * compStrategyMultipliers[payrollState.simple.compStrategy], deal.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Department Tables */}
          {Object.keys(departmentLabels).map(dept => renderDepartmentTable(dept as DeptKey))}
          
          {/* Restore Defaults Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleRestoreDefaults}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restore Defaults</span>
            </Button>
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
            {saveState === 'idle' && 'Save Payroll'}
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