import React, { useState, Fragment } from 'react';
import { Info } from 'lucide-react';
import { CashFlowRow } from '../../lib/finance/cashflow';
import { formatScaledCurrency, Scale } from '../../lib/pl/format';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

interface CashflowTableProps {
  rows: CashFlowRow[];
  currency: string;
  scale: Scale;
  exitYear: number | null;
}

export default function CashflowTable({ rows, currency, scale, exitYear }: CashflowTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getSectionHeaderStyle = (section: string) => {
    switch (section) {
      case 'memo': return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'unlevered': return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'levered': return 'bg-amber-100 text-amber-900 border-amber-300';
      default: return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  const getRowStyle = (row: CashFlowRow) => {
    const baseClasses = "border-b border-slate-100 hover:bg-slate-50/50 transition-colors";
    
    if (row.type === 'section') {
      return cn(baseClasses, getSectionHeaderStyle(row.section), "font-bold");
    }
    
    if (row.type === 'total') {
      return cn(baseClasses, "bg-slate-100 font-bold border-l-4 border-brand-500");
    }
    
    if (row.type === 'subtotal') {
      return cn(baseClasses, "bg-slate-50 font-semibold");
    }
    
    // Regular line items get subtle section coloring
    switch (row.section) {
      case 'memo': return cn(baseClasses, "bg-slate-50/20");
      case 'unlevered': return cn(baseClasses, "bg-blue-50/20");
      case 'levered': return cn(baseClasses, "bg-amber-50/20");
      default: return baseClasses;
    }
  };

  const renderValue = (value: number) => {
    const formatted = formatScaledCurrency(Math.abs(value), currency, scale);
    if (value < 0) {
      return <span className="text-red-600">({formatted})</span>;
    }
    return formatted;
  };

  const getTooltipContent = (rowId: string) => {
    const tooltips: Record<string, string> = {
      'ebitda': 'Earnings before interest, taxes, depreciation, and amortization from the P&L.',
      'tax': 'Corporate income tax on earnings before tax.',
      'capex': 'Capital expenditures including initial investment and ongoing improvements.',
      'sale-proceeds': 'Sale price minus selling costs, outstanding loan balance (for levered), and exit taxes.',
      'unlevered-cf': 'Property cash flow before financing effects.',
      'debt-draw': 'Initial loan proceeds received at closing.',
      'interest-expense': 'Annual interest payments on debt financing.',
      'principal-repayment': 'Annual principal amortization payments.',
      'levered-cf': 'Cash flow to equity investors after all financing effects.',
      'unlevered-irr': 'IRR on total project investment (unlevered).',
      'levered-irr': 'IRR on equity investment after debt financing.'
    };
    
    return tooltips[rowId] || 'Cash flow line item calculation.';
  };

  return (
    <div className="w-full max-w-[95vw] mx-auto">
      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="w-full text-sm">
              {/* Header */}
              <thead className="bg-slate-50 sticky top-0 z-20">
                <tr>
                  <th className="sticky left-0 bg-slate-50 z-30 text-left px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 min-w-[280px]">
                    Cash Flow Item
                  </th>
                  {Array.from({length: 11}, (_, i) => i).map(year => (
                    <th 
                      key={year} 
                      className="px-4 py-3 text-center font-bold text-slate-700 border-r border-slate-200 bg-slate-100 min-w-[120px]"
                    >
                      {year === 0 ? 'Year 0' : `Year ${year}`}
                      {exitYear && year > exitYear && (
                        <div className="text-xs text-slate-500 font-normal">(Post-Exit)</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {rows.map((row) => (
                  <tr 
                    key={row.id} 
                    className={getRowStyle(row)}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Cash Flow Item Column */}
                    <td className="sticky left-0 bg-white/95 backdrop-blur z-20 px-4 py-3 border-r border-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          row.type === 'total' || row.type === 'subtotal' ? 'font-bold' : 'font-medium',
                          row.type === 'section' ? 'uppercase tracking-wide' : ''
                        )}>
                          {row.label}
                        </span>
                        {row.type !== 'section' && (
                          <TooltipProvider>
                            <RadixTooltip>
                              <TooltipTrigger asChild>
                                <button className={cn(
                                  "transition-opacity",
                                  hoveredRow === row.id ? "opacity-100" : "opacity-0"
                                )}>
                                  <Info className="h-3 w-3 text-slate-400" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-sm">
                                  {getTooltipContent(row.id)}
                                </p>
                              </TooltipContent>
                            </RadixTooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    
                    {/* Year Data Columns */}
                    {row.years.map((yearData) => (
                      <td 
                        key={yearData.year} 
                        className="px-4 py-3 text-right border-r border-slate-100 tabular-nums"
                      >
                        {row.type === 'section' ? (
                          <span className="text-transparent">—</span>
                        ) : (
                          <span className={cn(
                            row.type === 'total' || row.type === 'subtotal' ? 'font-bold' : 'font-medium',
                            yearData.value < 0 ? 'text-red-600' : 'text-slate-900'
                          )}>
                            {row.id.includes('irr') && yearData.year > 1 ? 
                              '—' : 
                              renderValue(yearData.value)
                            }
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}