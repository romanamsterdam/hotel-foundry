import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Users, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useActiveDeal } from '../lib/deals/useActiveDeal';
import DealGuard from '../components/common/DealGuard';
import { getTotalRooms } from '../lib/rooms';
import type { 
  StaffingAssumptions, 
  StaffingOverrides, 
  LinkedStaffingValues 
} from '../lib/staffing/types';
import { createDefaultAssumptions, calculateRequiredStaffing } from '../lib/staffing/model';
import { getHardRuleFlags } from '../lib/staffing/flags';
import { coversPerDayFromUnderwriting, spaTreatmentsFromUnderwriting } from '../lib/underwriting/toStaffing';
import StaffingSummaryCards from '../components/staffing/StaffingSummaryCards';
import CoverageHeatmap from '../components/staffing/CoverageHeatmap';
import RoleGapTable from '../components/staffing/RoleGapTable';
import AssumptionsDrawer from '../components/staffing/AssumptionsDrawer';

export default function StaffingSenseCheckPage() {
  const { dealId, deal, status } = useActiveDeal();
  const [selectedYear, setSelectedYear] = useState<number>(3);
  const [assumptions, setAssumptions] = useState<StaffingAssumptions>(createDefaultAssumptions());
  const [overrides, setOverrides] = useState<StaffingOverrides>({});
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  if (status !== "ready") return <DealGuard status={status} />;

  // Load assumptions from deal if available
  useEffect(() => {
    if (deal?.assumptions?.staffingAssumptions) {
      setAssumptions(deal.assumptions.staffingAssumptions as StaffingAssumptions);
    }
    if (deal?.assumptions?.staffingOverrides) {
      setOverrides(deal.assumptions.staffingOverrides as StaffingOverrides);
    }
  }, [deal]);

  const rooms = getTotalRooms(deal);
  
  if (rooms === 0) {
    return (
      <div className="w-full max-w-[95vw] mx-auto rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Staffing Sense Check</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800 font-medium">
              Add rooms in Property Details to analyze staffing requirements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get exit year for horizon
  const exitSettings = deal.assumptions?.exitSettings;
  const exitYear = exitSettings?.strategy === 'SALE' ? exitSettings.sale.exitYear :
                   exitSettings?.strategy === 'REFINANCE' ? exitSettings.refinance.refinanceYear :
                   10;

  // Check if selected year is beyond exit
  const isPostExit = selectedYear > exitYear;

  // Calculate staffing requirements
  const staffingData = calculateRequiredStaffing(dealId!, selectedYear, assumptions, overrides);
  const hardRuleFlags = getHardRuleFlags(staffingData);

  // Get linked values from underwriting
  const linkedValues: LinkedStaffingValues | undefined = React.useMemo(() => {
    if (!deal?.roomRevenue || !deal?.fnbRevenue) return undefined;
    
    try {
      const covers = coversPerDayFromUnderwriting(dealId!, selectedYear - 1);
      const spa = spaTreatmentsFromUnderwriting(dealId!);
      const roomsSoldPerDay = deal.roomRevenue.totals.roomsSold / 365;
      const guestsPerRoom = deal.fnbRevenue.simple.avgGuestsPerOccRoom;
      
      return {
        breakfast: covers.breakfast,
        lunch: covers.lunch,
        dinner: covers.dinner,
        bar: covers.bar,
        spa: {
          treatmentsPerDay: spa.treatmentsPerDay,
          openHours: spa.openHours
        },
        guestsPerRoom,
        roomsSoldPerDay
      };
    } catch {
      return undefined;
    }
  }, [deal, dealId, selectedYear]);

  return (
    <div className="w-full max-w-[95vw] mx-auto space-y-6">
      {/* Header with Controls */}
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Staffing Sense Check</h1>
            <p className="text-sm text-slate-600">
              Compare current staffing vs operational requirements. Green = covered, red = shortfall.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <Link to={`/underwriting/summary/${dealId}`}>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>View Summary</span>
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Analysis Year</span>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: Math.min(exitYear, 10)}, (_, i) => i + 1).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      Year {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowAssumptions(true)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Assumptions</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Post-Exit Banner */}
      {isPostExit && (
        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-slate-600" />
            <span className="text-slate-700 font-medium text-sm">
              Exited in Year {exitYear} — staffing not required afterward
            </span>
          </div>
        </div>
      )}

      {/* Hard Rule Flags */}
      {hardRuleFlags.length > 0 && (
        <div className="space-y-3">
          {hardRuleFlags.map((flag, index) => (
            <div key={index} className={`rounded-lg border p-4 ${
              flag.type === 'error' 
                ? 'border-red-200 bg-red-50' 
                : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`h-5 w-5 ${
                  flag.type === 'error' ? 'text-red-600' : 'text-amber-600'
                }`} />
                <p className={`font-medium text-sm ${
                  flag.type === 'error' ? 'text-red-800' : 'text-amber-800'
                }`}>
                  {flag.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isPostExit && (
        <>
          {/* Summary Cards */}
          <StaffingSummaryCards 
            staffingData={staffingData} 
            assumptions={{
              hoursPerWeek: assumptions.hoursPerWeek,
              utilizationFactor: assumptions.utilizationFactor
            }}
          />

          {/* Coverage Heatmap */}
          <CoverageHeatmap staffingData={staffingData} />

          {/* Role Gap Table */}
          <RoleGapTable 
            staffingData={staffingData} 
            assumptions={assumptions}
            overrides={overrides}
            roomsSoldPerDay={deal.roomRevenue ? deal.roomRevenue.totals.roomsSold / 365 : rooms * 0.7}
          />
        </>
      )}

      {/* Assumptions Drawer */}
      <AssumptionsDrawer
        isOpen={showAssumptions}
        onClose={() => setShowAssumptions(false)}
        dealId={dealId!}
        yearIdx={selectedYear - 1}
        assumptions={assumptions}
        onAssumptionsChange={setAssumptions}
        overrides={overrides}
        onOverridesChange={setOverrides}
        linkedValues={linkedValues}
      />

      {/* Footer Note */}
      <div className="w-full rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="text-sm text-slate-600">
          <strong>What's this page?</strong> We check if your current team can realistically cover your opening hours and guest activity. 
          Calculations use industry productivity benchmarks and account for holidays, sick days, and training time.
        </div>
      </div>
    </div>
  );
}