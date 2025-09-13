import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle } from 'lucide-react';
import { riskNarrative } from '../../lib/summary/narrative';
import { THRESHOLDS } from '../../lib/summary/thresholds';

interface Risk {
  type: string;
  severity: 'red' | 'amber' | 'green';
  message: string;
  mitigation: string;
}

interface RisksMitigationsProps {
  gopPct: number;
  dscr: number;
  contingencyPct: number;
  fnbMargin: number;
  staffingGap: number;
  exitCapRate: number;
}

export default function RisksMitigations({
  gopPct,
  dscr,
  contingencyPct,
  fnbMargin,
  staffingGap,
  exitCapRate
}: RisksMitigationsProps) {
  // Auto-populate risks based on thresholds
  const risks: Risk[] = [];

  // GOP Risk
  if (gopPct < THRESHOLDS.gop.low) {
    risks.push({
      type: 'Profitability',
      severity: 'red',
      message: `GOP margin ${(gopPct * 100).toFixed(0)}% below typical range (20%+)`,
      mitigation: 'Review cost structure; consider service level adjustments'
    });
  } else if (gopPct > THRESHOLDS.gop.high) {
    risks.push({
      type: 'Profitability',
      severity: 'amber',
      message: `GOP margin ${(gopPct * 100).toFixed(0)}% may be optimistic (above 55%)`,
      mitigation: 'Validate cost assumptions against comparable properties'
    });
  }

  // DSCR Risk
  if (dscr > 0 && dscr < THRESHOLDS.dscr.ok) {
    risks.push({
      type: 'Debt Coverage',
      severity: 'red',
      message: `DSCR ${dscr.toFixed(2)}x below lender comfort zone (1.20x+)`,
      mitigation: 'Reduce debt or improve operating performance projections'
    });
  } else if (dscr > 0 && dscr < THRESHOLDS.dscr.good) {
    risks.push({
      type: 'Debt Coverage',
      severity: 'amber',
      message: `DSCR ${dscr.toFixed(2)}x tight but acceptable (target 1.35x+)`,
      mitigation: 'Monitor cash flow closely; maintain operating reserves'
    });
  }

  // Contingency Risk
  if (contingencyPct < THRESHOLDS.contingency.low) {
    risks.push({
      type: 'Budget Buffer',
      severity: 'amber',
      message: `Contingency ${(contingencyPct * 100).toFixed(0)}% below recommended minimum (5%+)`,
      mitigation: 'Increase contingency or secure additional funding sources'
    });
  }

  // F&B Risk
  if (fnbMargin <= 0) {
    risks.push({
      type: 'F&B Operations',
      severity: 'red',
      message: 'F&B department showing losses or break-even',
      mitigation: 'Review F&B pricing, menu costs, or consider outsourcing'
    });
  } else if (fnbMargin < THRESHOLDS.fnbMargin.ok) {
    risks.push({
      type: 'F&B Operations',
      severity: 'amber',
      message: `F&B margin ${(fnbMargin * 100).toFixed(0)}% below healthy range (10%+)`,
      mitigation: 'Optimize menu pricing and cost of goods sold'
    });
  }

  // Staffing Risk
  if (staffingGap >= THRESHOLDS.staffingGap.critical) {
    risks.push({
      type: 'Staffing',
      severity: 'red',
      message: `Critical staffing shortfall of ${staffingGap.toFixed(1)} FTE`,
      mitigation: 'Hire additional staff or adjust service hours before opening'
    });
  } else if (staffingGap >= THRESHOLDS.staffingGap.warning) {
    risks.push({
      type: 'Staffing',
      severity: 'amber',
      message: `Moderate staffing gap of ${staffingGap.toFixed(1)} FTE`,
      mitigation: 'Plan recruitment or consider part-time coverage'
    });
  }

  // Exit Risk
  if (exitCapRate < 5.0) {
    risks.push({
      type: 'Exit Valuation',
      severity: 'amber',
      message: `Exit cap rate ${exitCapRate}% may be optimistic for market conditions`,
      mitigation: 'Stress test with higher cap rates (6-8%) for conservative scenario'
    });
  } else if (exitCapRate > 8.0) {
    risks.push({
      type: 'Exit Valuation',
      severity: 'amber',
      message: `Exit cap rate ${exitCapRate}% seems conservative`,
      mitigation: 'Consider upside scenario with lower cap rates if market improves'
    });
  }

  const narrative = riskNarrative(risks);

  const getSeverityColor = (severity: 'red' | 'amber' | 'green') => {
    switch (severity) {
      case 'red': return 'text-red-600';
      case 'amber': return 'text-amber-600';
      case 'green': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  const getSeverityIcon = (severity: 'red' | 'amber' | 'green') => {
    switch (severity) {
      case 'red': return '🔴';
      case 'amber': return '🟡';
      case 'green': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg">Risks & Mitigations</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk narrative */}
        <p className="text-slate-700">{narrative}</p>

        {/* Risk list */}
        {risks.length > 0 ? (
          <div className="space-y-3">
            {risks.map((risk, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getSeverityIcon(risk.severity)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">{risk.type}</span>
                      <span className={`text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                        {risk.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{risk.message}</p>
                    <p className="text-sm text-slate-600 italic">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-slate-600">No significant risks identified</p>
            <p className="text-sm text-slate-500">All key metrics within acceptable ranges</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}