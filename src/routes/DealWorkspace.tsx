import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getDeal, removeDeal } from '../lib/dealStore';
import { Deal } from '../types/deal';
import { getTotalRooms } from '../lib/rooms';
import { eur0 } from '../lib/format';
import { underwritingSteps } from '../data/underwritingSteps';
import UnderwriteSidebar from '../components/UnderwriteSidebar';
import { loadProgress, setCompleted } from '../lib/uwProgress';
import KpiCard from '../components/KpiCard';
import { weightedADR, revpar, roomsMix, budgetStatus } from '../lib/kpis';
import { genericBenchmarks } from '../data/benchmarks';
import DealWelcome from '../components/DealWelcome';
import StageProgress from '../components/StageProgress';
import { ProjectSaveProvider } from '../lib/persist/ProjectSaveContext';
import type { PersistPayload } from '../lib/persist/ProjectSaveContext';
import PropertyDetailsForm from '../modules/underwriting/PropertyDetailsForm';
import InvestmentBudgetTable from '../modules/underwriting/InvestmentBudgetTable';
import RoomRevenue from '../modules/underwriting/RoomRevenue';
import FnBRevenue from '../modules/underwriting/FnBRevenue';
import OtherRevenue from '../modules/underwriting/OtherRevenue';
import OperatingExpenses from '../modules/underwriting/OperatingExpenses';
import PayrollModel from '../modules/underwriting/PayrollModel';
import RampMacroSettings from '../modules/underwriting/RampMacroSettings';
import FinancingStructure from '../modules/underwriting/FinancingStructure';
import ExitStrategy from '../modules/underwriting/ExitStrategy';
import { formatDate, formatRelativeTime } from '../lib/utils';
import SafeImage from '../components/SafeImage';
import PropertySummaryCard from '../components/PropertySummaryCard';
import PLStatement from '../modules/underwriting/pages/PLStatement';
import CashFlowStatement from '../modules/underwriting/pages/CashFlowStatement';
import ChartsKPIsPage from '../pages/ChartsKPIsPage';
import StaffingSenseCheckPage from '../pages/StaffingSenseCheckPage';
import UnderwritingSummaryPage from '../pages/UnderwritingSummaryPage';
import IntroductionPage from './IntroductionPage';
import { lastSavedLabel } from '../lib/utils';

export default function DealWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [activeId, setActiveId] = useState<string>('introduction');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [kpiUpdateKey, setKpiUpdateKey] = useState<number>(0);
  const [showPhotoLightbox, setShowPhotoLightbox] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<string | undefined>(id);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/underwriting');
      return;
    }

    const foundDeal = getDeal(id);
    if (!foundDeal) {
      navigate('/underwriting');
      return;
    }

    setDeal(foundDeal);
    setProjectId(id);
    setLastSaved(foundDeal.updatedAt);
  }, [id, navigate, refreshToken]);

  // Build payload for Supabase saves
  const payload: PersistPayload = useMemo(() => {
    if (!deal) return { name: "Untitled Deal", kpis: null };
    
    // Build comprehensive KPIs from current deal state
    const kpis = {
      rooms: getTotalRooms(deal),
      location: deal.location,
      propertyType: deal.propertyType,
      starRating: deal.stars,
      currency: deal.currency,
      gfaSqm: deal.gfaSqm,
      purchasePrice: deal.purchasePrice,
      facilities: deal.facilities || [],
      roomTypes: deal.roomTypes || [],
      // Add revenue KPIs if available
      ...(deal.roomRevenue && {
        avgADR: deal.roomRevenue.totals.avgADR,
        avgOccupancy: deal.roomRevenue.totals.avgOccPct,
        avgRevPAR: deal.roomRevenue.totals.avgRevPAR,
        totalRoomsRevenue: deal.roomRevenue.totals.roomsRevenue
      }),
      // Add budget KPIs if available
      ...(deal.budget && {
        totalInvestment: deal.budget.grandTotal,
        costPerRoom: getTotalRooms(deal) > 0 ? deal.budget.grandTotal / getTotalRooms(deal) : 0,
        costPerSqm: deal.gfaSqm > 0 ? deal.budget.grandTotal / deal.gfaSqm : 0,
        contingencyPct: deal.budget.contingencyPct
      }),
      // Add payroll KPIs if available
      ...(deal.payrollModel && {
        totalPayrollAnnual: deal.payrollModel.simple.ftePerRoom * deal.payrollModel.simple.baseReceptionSalary * getTotalRooms(deal),
        ftePerRoom: deal.payrollModel.simple.ftePerRoom
      })
    };

    return {
      id: projectId,
      name: deal.name,
      property_id: null, // Will be set from template selection
      stage: "underwriting",
      currency: deal.currency,
      kpis
    };
  }, [deal, projectId]);

  const handleAfterSave = (row: Project) => {
    if (!projectId && row?.id) {
      setProjectId(row.id);
      // Optionally update URL to reflect new ID
      // navigate(`/underwriting/${row.id}`, { replace: true });
    }
    // Update last saved timestamp for immediate UI feedback
    if (row?.updated_at) {
      setLastSaved(row.updated_at);
    }
  };
  const handleDelete = () => {
    if (!deal) return;
    if (confirm(`Delete "${deal.name}"? This action cannot be undone.`)) {
      removeDeal(deal.id);
      navigate('/underwriting');
    }
  };

  const handleMarkComplete = () => {
    if (!deal || !activeId) return;
    setCompleted(deal.id, activeId as any, true);
    // Refresh to show updated progress
    setActiveId(activeId); // Force re-render
  };

  const handleFormSaved = () => {
    // Force refresh of deal data and KPIs
    setRefreshToken(crypto.randomUUID());
    setKpiUpdateKey(prev => prev + 1);
  };

  // Animated KPI component
  const AnimatedKpiCard = ({ label, value, sub, tip }: { label: string; value: string; sub?: string; tip?: string }) => {
    return (
      <div 
        key={kpiUpdateKey} 
        className="rounded-xl border border-white/50 bg-card-gradient backdrop-blur-sm p-4 shadow-card animate-in fade-in-0 duration-500"
      >
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium text-navy-600">{label}</div>
          {kpiUpdateKey > 0 && (
            <TrendingUp className="h-4 w-4 text-green-500 animate-pulse" />
          )}
        </div>
        <div className="mt-2 text-2xl font-semibold text-navy-900 animate-in slide-in-from-bottom-2 duration-700">
          {value}
        </div>
        {sub && <div className="mt-1 text-xs text-navy-500">{sub}</div>}
        {tip && <div className="mt-3 rounded-md bg-navy-50/50 p-2 text-xs text-navy-600">{tip}</div>}
      </div>
    );
  };

  if (!deal) {
    return <div>Loading...</div>;
  }

  const adr = weightedADR(deal);
  const rp = revpar(adr, 0.70);
  const mix = roomsMix(deal);
  const bud = budgetStatus(deal);

  return (
    <ProjectSaveProvider buildPayload={() => payload} onSaved={handleAfterSave}>
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          {deal.photoUrl && (
            <button
              onClick={() => setShowPhotoLightbox(true)}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <SafeImage
                src={deal.photoUrl}
                fallbackText={deal.name}
                className="w-16 h-16 rounded-lg"
                alt={deal.name}
              />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{deal.name}</h1>
            <div className="text-sm text-slate-500 space-x-2">
              <span>ID: {deal.id.slice(0, 8)}</span>
              <span>•</span>
              <span>Created: {formatDate(deal.createdAt)}</span>
              <span>•</span>
              <span>Last saved: {lastSavedLabel(lastSaved || deal.updatedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-slate-600 mb-4">
          <span>{deal.location}</span>
          <span>•</span>
          <span>{getTotalRooms(deal)} rooms</span>
          <span>•</span>
          <span>{eur0(deal.purchasePrice)}</span>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate('/underwriting')}>
            ← Back to deals
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Deal
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-6 space-y-6">
        {/* Property Summary */}
        <PropertySummaryCard deal={deal} />
        
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AnimatedKpiCard label="Weighted ADR" value={`€${adr.toFixed(0)}`} sub="Based on room-type ADR weights" />
          <AnimatedKpiCard label="RevPAR (70% occ.)" value={`€${rp.toFixed(0)}`} sub="You can adjust occupancy later" />
          <AnimatedKpiCard label="Rooms & Mix" value={`${getTotalRooms(deal)} rooms`} sub={mix.map(m=>`${m.name} ${Math.round(m.share*100)}%`).join(" • ")} />
          <AnimatedKpiCard label="Purchase Price" value={bud.purchasePriceEntered ? `€${bud.value.toLocaleString()}` : "Not set"} sub="Net purchase price from budget" />
        </div>
      </div>

      {/* Mobile step selector */}
      <div className="lg:hidden mb-4">
        <select
          className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
        >
          <option value="introduction">Introduction</option>
          <option value="propertyDetails">Property Details</option>
          <option value="investmentBudget">Investment Budget</option>
          <option value="roomRevenue">Room Revenue</option>
          <option value="fbRevenue">F&B Revenue</option>
          <option value="otherRevenue">Other Revenue</option>
          <option value="operatingCosts">Operating Costs</option>
          <option value="payrollModel">Payroll Model</option>
          <option value="rampSettings">Ramp & Macro</option>
          <option value="financingStructure">Financing Structure</option>
        </select>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* LEFT: sidebar */}
        <div className="hidden lg:block">
          <UnderwriteSidebar dealId={deal.id} activeId={activeId} onSelect={setActiveId} />
        </div>

        {/* RIGHT: content */}
        <div className="space-y-6">
          {activeId === 'introduction' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <IntroductionPage onGetStarted={() => setActiveId('propertyDetails')} />
            </div>
          )}

          {activeId === 'propertyDetails' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <PropertyDetailsForm 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'investmentBudget' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <InvestmentBudgetTable 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'roomRevenue' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <RoomRevenue 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'fbRevenue' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <FnBRevenue 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'otherRevenue' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <OtherRevenue 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'operatingCosts' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <OperatingExpenses 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'payrollModel' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <PayrollModel 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'rampSettings' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <RampMacroSettings 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'financingStructure' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <FinancingStructure 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'exitStrategy' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <ExitStrategy 
                dealId={deal.id} 
                onSaved={handleFormSaved}
              />
            </div>
          )}

          {activeId === 'pl-statement' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <PLStatement dealId={deal.id} />
            </div>
          )}

          {activeId === 'cash-flow-statement' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <CashFlowStatement dealId={deal.id} />
            </div>
          )}

          {activeId === 'charts-kpis' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <ChartsKPIsPage />
            </div>
          )}

          {activeId === 'staffing-sense-check' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <StaffingSenseCheckPage />
            </div>
          )}

          {activeId === 'underwriting-summary' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <UnderwritingSummaryPage />
            </div>
          )}

        </div>
      </div>

      {/* Photo Lightbox */}
      {showPhotoLightbox && deal.photoUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhotoLightbox(false)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={deal.photoUrl}
              alt={deal.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
    </ProjectSaveProvider>
  );
}