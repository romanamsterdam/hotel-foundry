// src/config/budgetTooltips.ts
export type BudgetTooltipKey =
  | 'construction'
  | 'ffe'
  | 'profFees'
  | 'contingency'
  | 'netPurchasePrice'
  | 'realEstateTransferTax'
  | 'dealCosts'
  | 'siteAcquisitionSubtotal'
  | 'constructionSubtotal'
  | 'planningMunicipality'
  | 'developmentFee'
  | 'developmentSubtotal'
  | 'insuranceAdmin'
  | 'otherDevCosts'
  | 'otherDevSubtotal'
  | 'preOpeningBudget'
  | 'preOpeningSubtotal'
  | 'contingencyPercent'
  | 'contingencyBudget'
  | 'grandTotalExVat';

export const BUDGET_TOOLTIPS: Record<BudgetTooltipKey, { meaning: string; applied?: string }> = {
  construction: { 
    meaning: 'Building, renovation, and fit-out works for the hotel structure.', 
    applied: 'Benchmarks apply per sqm based on building area.' 
  },
  ffe: { 
    meaning: 'Furniture, fixtures, equipment, and operating supplies needed to run the hotel.', 
    applied: 'Benchmarks apply per room based on total room count.' 
  },
  profFees: { 
    meaning: 'Architects, engineers, project management, and construction supervision costs.', 
    applied: 'Typically a percentage of Construction Subtotal (8-15%).' 
  },
  contingency: { 
    meaning: 'Extra buffer budget to cover unexpected costs during construction.', 
    applied: 'Usually a percentage of eligible costs (Sections 1–5).' 
  },

  netPurchasePrice: { 
    meaning: 'The agreed price for buying the property excluding transaction costs.',
    applied: 'This value syncs automatically with Purchase Price in Property Details. Changes in either location update both fields.'
  },
  realEstateTransferTax: { 
    meaning: 'Government tax paid when purchasing the property.', 
    applied: 'Typically 6-10% of purchase price depending on location and property type.' 
  },
  dealCosts: { 
    meaning: 'Transaction costs such as legal fees, due diligence, and advisory fees.', 
    applied: 'Usually 1-3% of purchase price for professional services during acquisition.' 
  },
  siteAcquisitionSubtotal: { 
    meaning: 'Total of purchase price and acquisition-related costs.' 
  },

  constructionSubtotal: { 
    meaning: 'Sum of hard construction and FF&E/OS&E before soft costs.' 
  },
  planningMunicipality: { 
    meaning: 'Municipal permits, planning applications, and regulatory approval fees.', 
    applied: 'Usually 1-3% of construction costs for permits and approvals.' 
  },
  developmentFee: { 
    meaning: 'Fee paid to development manager or general contractor for project oversight.', 
    applied: 'Typically 2-5% of construction costs for development management.' 
  },
  developmentSubtotal: { 
    meaning: 'Total of soft/development costs.' 
  },

  insuranceAdmin: { 
    meaning: 'Construction insurance, bonding, and administrative costs during development.', 
    applied: 'Usually 0.5-2% of construction costs for insurance and admin.' 
  },
  otherDevCosts: { 
    meaning: 'Miscellaneous development costs not covered in other categories.', 
    applied: 'Buffer for additional development expenses - typically 0.5-2%.' 
  },
  otherDevSubtotal: { 
    meaning: 'Total of other development costs.' 
  },

  preOpeningBudget: { 
    meaning: 'Marketing, staff training, and operational setup costs before hotel opens.', 
    applied: 'Applies per room - typically €2,000-5,000 per room for pre-opening.' 
  },
  preOpeningSubtotal: { 
    meaning: 'Total of pre-opening costs.' 
  },

  contingencyPercent: { 
    meaning: 'Chosen contingency rate applied to eligible costs.', 
    applied: 'Percentage of total (Sections 1-5) - typically 5-15% for risk management.' 
  },
  contingencyBudget: { 
    meaning: 'Calculated contingency amount at the chosen percentage.', 
    applied: 'Applied to sum of all sections before contingency.' 
  },

  grandTotalExVat: { 
    meaning: 'Grand total of all sections before VAT.' 
  },
};