import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AdminDeal } from '../../types/admin';
import { getDeal } from '../../lib/data/deals';
import { formatCurrency, formatPercent, isoToDate } from '../../lib/format';

export default function AdminDealInspectPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const [deal, setDeal] = useState<AdminDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeal = async () => {
      if (!dealId) {
        setError('Deal ID not provided');
        setLoading(false);
        return;
      }

      try {
        const dealData = await getDeal(dealId);
        if (!dealData) {
          setError('Deal not found');
        } else {
          setDeal(dealData);
        }
      } catch (err) {
        setError('Failed to load deal');
      } finally {
        setLoading(false);
      }
    };

    loadDeal();
  }, [dealId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Deal Not Found</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link to="/admin/deals">
              <Button className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Deals</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const InfoCard = ({ 
    title, 
    children, 
    className = '' 
  }: { 
    title: string; 
    children: React.ReactNode; 
    className?: string; 
  }) => (
    <Card className={`border-slate-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
      </CardContent>
    </Card>
  );

  const InfoRow = ({ 
    label, 
    value, 
    className = '' 
  }: { 
    label: string; 
    value: React.ReactNode; 
    className?: string; 
  }) => (
    <div className={`flex justify-between text-sm ${className}`}>
      <span className="text-slate-600">{label}:</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Deal Inspection</h1>
            <p className="text-slate-600">Read-only view of deal inputs and assumptions</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              disabled
              className="flex items-center space-x-2 opacity-50"
              title="Available when deal exists in main system"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Full Model</span>
            </Button>
            <Link to="/admin/deals">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Deals</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Deal Overview */}
        <Card className="border-slate-200 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{deal.title}</CardTitle>
              <Badge variant="secondary">ID: {deal.id.slice(0, 8)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <InfoRow label="Owner" value={deal.userEmail || '—'} />
              <InfoRow label="Last Edited" value={isoToDate(deal.lastEditedAt)} />
              <InfoRow 
                label="Project IRR" 
                value={deal.projectIRR ? (
                  <span className={
                    deal.projectIRR >= 0.15 ? 'text-green-600' : 
                    deal.projectIRR >= 0.10 ? 'text-amber-600' : 'text-red-600'
                  }>
                    {formatPercent(deal.projectIRR)}
                  </span>
                ) : '—'} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Key KPIs */}
            <InfoCard title="Key KPIs">
              {deal.kpis ? (
                <>
                  <InfoRow label="Rooms" value={deal.kpis.rooms || '—'} />
                  <InfoRow label="ADR" value={deal.kpis.adr ? formatCurrency(deal.kpis.adr, 'EUR') : '—'} />
                  <InfoRow label="Occupancy" value={deal.kpis.occ ? formatPercent(deal.kpis.occ) : '—'} />
                  <InfoRow label="RevPAR" value={deal.kpis.revpar ? formatCurrency(deal.kpis.revpar, 'EUR') : '—'} />
                </>
              ) : (
                <p className="text-slate-500 italic">Not provided</p>
              )}
            </InfoCard>

            {/* Payroll */}
            <InfoCard title="Payroll">
              {deal.payroll ? (
                <>
                  <InfoRow label="Total Annual" value={formatCurrency(deal.payroll.totalAnnual, 'EUR')} />
                  <InfoRow label="Front Office" value={formatCurrency(deal.payroll.frontOffice, 'EUR')} />
                  <InfoRow label="Housekeeping" value={formatCurrency(deal.payroll.housekeeping, 'EUR')} />
                  <InfoRow label="F&B" value={formatCurrency(deal.payroll.fnb, 'EUR')} />
                  <InfoRow label="Management" value={formatCurrency(deal.payroll.management, 'EUR')} />
                </>
              ) : (
                <p className="text-slate-500 italic">Not provided</p>
              )}
            </InfoCard>

            {/* Operating Expenses */}
            <InfoCard title="Operating Expenses">
              {deal.opex ? (
                <>
                  <InfoRow label="Utilities" value={formatCurrency(deal.opex.utilities, 'EUR')} />
                  <InfoRow label="Maintenance" value={formatCurrency(deal.opex.maintenance, 'EUR')} />
                  <InfoRow label="Marketing" value={formatCurrency(deal.opex.marketing, 'EUR')} />
                  <InfoRow label="Insurance" value={formatCurrency(deal.opex.insurance, 'EUR')} />
                </>
              ) : (
                <p className="text-slate-500 italic">Not provided</p>
              )}
            </InfoCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* CapEx */}
            <InfoCard title="CapEx (Year 0)">
              {deal.capex ? (
                <>
                  <InfoRow 
                    label="Total Investment" 
                    value={formatCurrency(deal.capex.year0, 'EUR')} 
                    className="border-b border-slate-200 pb-2 mb-2"
                  />
                  {deal.capex.items && deal.capex.items.length > 0 ? (
                    deal.capex.items.map((item, index) => (
                      <InfoRow 
                        key={index}
                        label={item.name} 
                        value={formatCurrency(item.amount, 'EUR')} 
                      />
                    ))
                  ) : (
                    <p className="text-slate-500 italic text-sm">No itemized breakdown</p>
                  )}
                </>
              ) : (
                <p className="text-slate-500 italic">Not provided</p>
              )}
            </InfoCard>

            {/* Financing */}
            <InfoCard title="Financing">
              {deal.financing ? (
                <>
                  <InfoRow label="LTV" value={formatPercent(deal.financing.ltv)} />
                  <InfoRow label="Interest Rate" value={formatPercent(deal.financing.rate)} />
                  <InfoRow label="Term" value={`${deal.financing.termYears} years`} />
                </>
              ) : (
                <p className="text-slate-500 italic">Not provided</p>
              )}
            </InfoCard>

            {/* Exit Strategy */}
            <InfoCard title="Exit Strategy">
              {deal.exit ? (
                <>
                  <InfoRow label="Exit Year" value={`Year ${deal.exit.year}`} />
                  <InfoRow label="Exit Cap Rate" value={formatPercent(deal.exit.exitCapRate)} />
                  <InfoRow label="Sale Price" value={formatCurrency(deal.exit.salePrice, 'EUR')} />
                </>
              ) : (
                <p className="text-slate-500 italic">Not provided</p>
              )}
            </InfoCard>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            This is a read-only inspection view. Data shown as configured by the deal owner.
          </p>
        </div>
      </div>
    </div>
  );
}