import React, { Fragment, useState } from 'react';
import { Info } from 'lucide-react';
import { PLRow } from '../../lib/pl/plCalculations';
import { formatScaledCurrency, formatPct, formatPorPar, Scale } from '../../lib/pl/format';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

interface PLDataTableProps {
  rows: PLRow[];
  showRatios: boolean;
  scale: Scale;
  currency: string;
  exitYear: number | null;
}

export function PLDataTable({ rows, showRatios, scale, currency, exitYear }: PLDataTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Group rows by section for rendering
  const groupedRows = rows.reduce((acc, row) => {
    if (!acc[row.group]) acc[row.group] = [];
    acc[row.group].push(row);
    return acc;
  }, {} as Record<string, PLRow[]>);

  // Section order matching spreadsheet
  const sectionOrder: Array<keyof typeof groupedRows> = [
    'REVENUE', 'DIRECT', 'UNDISTRIBUTED', 'FIXED', 'SUMMARY'
  ];

  const getSectionHeaderStyle = (group: string) => {
    switch (group) {
      case 'REVENUE': return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'DIRECT': return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'UNDISTRIBUTED': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'FIXED': return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'SUMMARY': return 'bg-slate-100 text-slate-900 border-slate-300';
      default: return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  const getRowStyle = (row: PLRow) => {
    const baseClasses = "border-b border-slate-100 hover:bg-slate-50/50 transition-colors";
    
    if (row.type === 'section') {
      return cn(baseClasses, getSectionHeaderStyle(row.group), "font-bold");
    }
    
    if (row.type === 'total') {
      return cn(baseClasses, "bg-slate-100 font-bold border-l-4 border-brand-500");
    }
    
    if (row.type === 'subtotal') {
      return cn(baseClasses, "bg-slate-50 font-semibold");
    }
    
    // Regular line items get subtle group coloring
    switch (row.group) {
      case 'REVENUE': return cn(baseClasses, "bg-blue-50/20");
      case 'DIRECT': return cn(baseClasses, "bg-rose-50/20");
      case 'UNDISTRIBUTED': return cn(baseClasses, "bg-amber-50/20");
      case 'FIXED': return cn(baseClasses, "bg-purple-50/20");
      case 'SUMMARY': return cn(baseClasses, "bg-slate-50/20");
      default: return baseClasses;
    }
  };

  const renderValue = (value: number, isNegative?: boolean) => {
    if (!isFinite(value) || isNaN(value)) return '—';
    const formatted = formatScaledCurrency(Math.abs(value), currency, scale);
    if (isNegative || value < 0) {
      return <span className="text-red-600">({formatted})</span>;
    }
    return formatted;
  };

  const renderRatio = (value: number | undefined, isPercent: boolean = false) => {
    if (value === undefined || !isFinite(value) || isNaN(value)) return '—';
    if (isPercent) return formatPct(value);
    return formatPorPar(value, currency);
  };

  // Derive years from actual data
  const yearsCount = rows?.[0]?.years?.length ?? 10;
  const years = Array.from({ length: yearsCount }, (_, idx) => idx + 1);

  // Safety check
  if (!rows?.length) {
    return (
      <div className="w-full max-w-[95vw] mx-auto rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-slate-500">No P&L data available.</div>
      </div>
    );
  }
  const columnsPerYear = showRatios ? 4 : 1;

  return (
    <div className="w-full max-w-[95vw] mx-auto">
      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="w-full text-sm">
              {/* Multi-row header */}
              <thead className="bg-slate-50 sticky top-0 z-20">
                {/* Year headers row */}
                <tr>
                  <th className="sticky left-0 bg-slate-50 z-30 text-left px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 min-w-[80px]">
                    Section
                  </th>
                  <th className="sticky left-20 bg-slate-50 z-30 text-left px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 min-w-[220px]">
                    P&L Line Item
                  </th>
                  {years.map((year) => (
                    <th
                      key={`year-${year}`}
                      colSpan={columnsPerYear}
                      className={cn(
                        "px-2 py-3 text-center font-bold text-slate-700 border-r border-slate-200 bg-slate-100",
                        exitYear && year > exitYear ? "bg-slate-200 text-slate-500" : ""
                      )}
                    >
                      Year {year}
                      {exitYear && year > exitYear && (
                        <div className="text-xs font-normal">(Post-Exit)</div>
                      )}
                    </th>
                  ))}
                </tr>
                
                {/* Sub-column headers row */}
                <tr>
                  <th className="sticky left-0 bg-slate-50 z-30 border-r border-slate-200"></th>
                  <th className="sticky left-20 bg-slate-50 z-30 border-r border-slate-200"></th>
                  {years.map((year) => (
                    <Fragment key={`subheader-${year}`}>
                      <th className="px-3 py-2 text-center font-medium text-slate-600 border-r border-slate-100 min-w-[100px]">
                        Total
                      </th>
                      {showRatios && (
                        <>
                          <th className="px-2 py-2 text-center font-medium text-slate-600 border-r border-slate-100 min-w-[80px]">
                            % of TR
                          </th>
                          <th className="px-2 py-2 text-center font-medium text-slate-600 border-r border-slate-100 min-w-[80px]">
                            /POR
                          </th>
                          <th className="px-2 py-2 text-center font-medium text-slate-600 border-r border-slate-200 min-w-[80px]">
                            <TooltipProvider>
                              <RadixTooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-slate-600 hover:text-slate-900">
                                    /PR
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-sm">
                                    Per Room (key): Value divided by the number of rooms (keys) in operation for that year.
                                  </p>
                                </TooltipContent>
                              </RadixTooltip>
                            </TooltipProvider>
                          </th>
                        </>
                      )}
                    </Fragment>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {sectionOrder.map(group => {
                  const sectionRows = groupedRows[group] || [];
                  
                  return sectionRows.map((row, index) => {
                    const isFirstInSection = index === 0;
                    
                    return (
                      <tr 
                        key={row.id} 
                        className={getRowStyle(row)}
                        onMouseEnter={() => setHoveredRow(row.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {/* Section Column */}
                        <td className="sticky left-0 bg-white/95 backdrop-blur z-20 px-4 py-3 border-r border-slate-200">
                          {isFirstInSection && row.type !== 'section' && (
                            <div className={cn(
                              "text-xs font-bold uppercase tracking-wide px-2 py-1 rounded",
                              getSectionHeaderStyle(group)
                            )}>
                              {group.replace('_', ' ')}
                            </div>
                          )}
                        </td>
                        
                        {/* P&L Line Item Column */}
                        <td className="sticky left-20 bg-white/95 backdrop-blur z-20 px-4 py-3 border-r border-slate-200">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              row.type === 'total' || row.type === 'subtotal' ? 'font-bold' : 'font-medium',
                              row.type === 'section' ? 'uppercase tracking-wide' : ''
                            )}>
                              {row.label}
                            </span>
                            <TooltipProvider>
                              <RadixTooltip>
                                <TooltipTrigger asChild>
                                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Info className="h-3 w-3 text-slate-400" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-sm">
                                    {/* Add tooltip content based on row.id */}
                                    {row.label} calculation details
                                  </p>
                                </TooltipContent>
                              </RadixTooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                        
                        {/* Year Data Columns - Separate columns for each metric */}
                        {row.years.map((yearData, idx) => {
                          const isPostExit = exitYear && yearData.year > exitYear;
                          const cellClasses = cn(
                            "px-3 py-3 text-right border-r border-slate-100 tabular-nums",
                            isPostExit ? "bg-slate-100 text-slate-400" : ""
                          );
                          
                          return (
                          <Fragment key={`${row.id}-year-${yearData.year}`}>
                            {/* Total Column */}
                            <td className={cellClasses}>
                              <span className={cn(
                                row.type === 'total' || row.type === 'subtotal' ? 'font-bold' : 'font-medium',
                                yearData.total < 0 && !isPostExit ? 'text-red-600' : isPostExit ? 'text-slate-400' : 'text-slate-900'
                              )}>
                                {renderValue(yearData.total, yearData.total < 0)}
                              </span>
                            </td>
                            
                            {/* Ratio Columns (only if enabled) */}
                            {showRatios && (
                              <>
                                {/* % of TR Column */}
                                <td className={cn(cellClasses, "px-2")}>
                                  <span className={cn("text-xs", isPostExit ? "text-slate-400" : "text-slate-600")}>
                                    {renderRatio(yearData.pctOfTR, true)}
                                  </span>
                                </td>
                                
                                {/* POR Column */}
                                <td className={cn(cellClasses, "px-2")}>
                                  <span className={cn("text-xs", isPostExit ? "text-slate-400" : "text-slate-600")}>
                                    {renderRatio(yearData.por)}
                                  </span>
                                </td>
                                
                                {/* PAR Column */}
                                <td className={cn(cellClasses, "px-2 border-r-slate-200")}>
                                  <span className={cn("text-xs", isPostExit ? "text-slate-400" : "text-slate-600")}>
                                    {renderRatio(yearData.par)}
                                  </span>
                                </td>
                              </>
                            )}
                          </Fragment>
                        );
                        })}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}