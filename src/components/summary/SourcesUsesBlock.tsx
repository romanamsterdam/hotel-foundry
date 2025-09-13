import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { THRESHOLDS } from '../../lib/summary/thresholds';

interface SourcesUsesBlockProps {
  deal: Deal;
}

export default function SourcesUsesBlock({ deal }: SourcesUsesBlockProps) {
  const budget = deal.budget;
  const financingSettings = deal.assumptions?.financingSettings;
  
  if (!budget) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <p className="text-slate-500">Investment budget not configured yet.</p>
        </CardContent>
      </Card>
    );
  }

  const projectCost = budget.grandTotal;
  const loanAmount = financingSettings ? (projectCost * financingSettings.ltcPct / 100) : 0;
  const equityRequired = projectCost - loanAmount;
  const contingencyPct = budget.contingencyPct / 100;

  // Uses breakdown
  const uses = [
    { label: 'Site Acquisition', value: budget.siteAcquisition, color: 'bg-blue-500' },
    { label: 'Construction', value: budget.constructionSubtotal, color: 'bg-green-500' },
    { label: 'Development Costs', value: budget.developmentSubtotal, color: 'bg-yellow-500' },
    { label: 'Other Dev Costs', value: budget.otherDevSubtotal, color: 'bg-purple-500' },
    { label: 'Pre-opening', value: budget.preOpeningSubtotal, color: 'bg-pink-500' },
    { label: 'Contingency', value: budget.contingencyAmount, color: 'bg-red-500' }
  ];

  // Sources breakdown
  const sources = [
    { label: 'Equity', value: equityRequired, color: 'bg-emerald-500' },
    ...(loanAmount > 0 ? [{ label: 'Debt', value: loanAmount, color: 'bg-orange-500' }] : [])
  ];

  const lowContingency = contingencyPct < THRESHOLDS.contingency.low;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Sources & Uses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Low Contingency Warning */}
        {lowContingency && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Low buffer—consider increasing contingency to at least 5% for unexpected costs.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Uses */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Uses of Funds</h4>
            <div className="space-y-2">
              {uses.map((use, index) => {
                const percentage = projectCost > 0 ? (use.value / projectCost) * 100 : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${use.color}`}></div>
                      <span className="text-sm text-slate-700">{use.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {formatCurrency(use.value, deal.currency)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sources */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Sources of Funds</h4>
            <div className="space-y-2">
              {sources.map((source, index) => {
                const percentage = projectCost > 0 ? (source.value / projectCost) * 100 : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${source.color}`}></div>
                      <span className="text-sm text-slate-700">{source.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {formatCurrency(source.value, deal.currency)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visual breakdown bar */}
        <div>
          <div className="flex h-4 rounded-full overflow-hidden bg-slate-200">
            {uses.map((use, index) => {
              const percentage = projectCost > 0 ? (use.value / projectCost) * 100 : 0;
              return (
                <div
                  key={index}
                  className={`${use.color} hover:opacity-80 transition-opacity`}
                  style={{ width: `${percentage}%` }}
                  title={`${use.label}: ${formatCurrency(use.value, deal.currency)} (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>Site Acquisition</span>
            <span>Construction</span>
            <span>Development</span>
            <span>Contingency</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}