import { ExitSettings } from '../types/exitStrategy';
import { selectEbitdaByYear } from './finance/pnlSelectors';
import { computeUnleveredCashflowByYear } from './finance/cashflow';

export function calculateExitReturns(
  settings: ExitSettings,
  projectCost: number,
  dealId?: string
): ExitSettings['estimatedReturns'] {
  // Get real EBITDA from P&L if dealId provided
  let referenceEBITDA = 800000; // Fallback for backward compatibility
  
  if (dealId) {
    const ebitdaByYear = selectEbitdaByYear(dealId);
    const exitYear = settings.strategy === 'SALE' ? settings.sale.exitYear :
                     settings.strategy === 'REFINANCE' ? settings.refinance.refinanceYear : 5;
    const exitKey = `y${exitYear}`;
    referenceEBITDA = ebitdaByYear[exitKey] || 800000; // Use P&L data or fallback
  }
  
  switch (settings.strategy) {
    case "SALE":
      const salePrice = referenceEBITDA / (settings.sale.exitCapRate / 100);
      const sellingCosts = salePrice * (settings.sale.sellingCostsPct / 100);
      const netSaleProceeds = salePrice - sellingCosts;
      const developmentProfit = netSaleProceeds - projectCost;
      
      return {
        irrLevered: 15.0 + (settings.sale.exitYear - 5) * 0.5, // Dummy: varies by exit year
        irrUnlevered: 12.0 + (settings.sale.exitYear - 5) * 0.3,
        developmentProfit
      };
      
    case "REFINANCE":
      const propertyValue = referenceEBITDA / 0.065; // 6.5% cap rate assumption
      const newLoanAmount = propertyValue * (settings.refinance.ltvAtRefinance / 100);
      const refinanceCosts = newLoanAmount * (settings.refinance.refinanceCostsPct / 100);
      const netCashOut = newLoanAmount - refinanceCosts - (projectCost * 0.4); // Assume 40% original LTC
      
      return {
        irrLevered: 18.0, // Higher for refinance strategy
        irrUnlevered: 12.0,
        developmentProfit: netCashOut
      };
      
    case "HOLD_FOREVER":
    default:
      return {
        irrLevered: 13.5, // Lower for hold strategy
        irrUnlevered: 11.5,
        developmentProfit: projectCost * 0.25 // 25% of project cost as placeholder
      };
  }
}

export function calculateSaleSummary(
  settings: ExitSettings,
  projectCost: number,
  dealId?: string
) {
  // Get real EBITDA from P&L if dealId provided
  let referenceEBITDA = 800000; // Fallback
  
  if (dealId) {
    const ebitdaByYear = selectEbitdaByYear(dealId);
    const exitKey = `y${settings.sale.exitYear}`;
    referenceEBITDA = ebitdaByYear[exitKey] || 800000;
  }
  
  const salePrice = referenceEBITDA > 0 ? referenceEBITDA / (settings.sale.exitCapRate / 100) : 0;
  const sellingCosts = salePrice * (settings.sale.sellingCostsPct / 100);
  const netSaleProceeds = salePrice - sellingCosts;
  const developmentProfit = netSaleProceeds - projectCost;
  
  return {
    referenceEBITDA,
    exitCapRate: settings.sale.exitCapRate,
    estimatedSalePrice: salePrice,
    sellingCosts,
    netSaleProceeds,
    totalCapEx: projectCost,
    developmentProfit
  };
}

export function calculateRefinanceSummary(
  settings: ExitSettings,
  projectCost: number,
  dealId?: string
) {
  // Get real EBITDA from P&L if dealId provided
  let referenceEBITDA = 800000; // Fallback
  
  if (dealId) {
    const ebitdaByYear = selectEbitdaByYear(dealId);
    const exitKey = `y${settings.refinance.refinanceYear}`;
    referenceEBITDA = ebitdaByYear[exitKey] || 800000;
  }
  
  const propertyValue = referenceEBITDA / 0.065; // 6.5% cap rate assumption
  const newLoanAmount = propertyValue * (settings.refinance.ltvAtRefinance / 100);
  const refinanceCosts = newLoanAmount * (settings.refinance.refinanceCostsPct / 100);
  const originalLoanBalance = projectCost * 0.4; // Assume 40% original LTC
  const netCashOut = newLoanAmount - refinanceCosts - originalLoanBalance;
  
  return {
    referenceEBITDA,
    refinanceLTV: settings.refinance.ltvAtRefinance,
    newLoanAmount,
    refinanceCosts,
    netCashOut
  };
}