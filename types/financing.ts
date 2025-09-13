export type InvestmentOrder = "EQUITY_FIRST" | "LOAN_FIRST";

export type FinancingSettings = {
  ltcPct: number;                 // Loan-to-Cost %, 0–100
  investmentOrder: InvestmentOrder;

  interestRatePct: number;        // annual nominal (e.g., 5.5)
  loanTermYears: number;          // total contractual term
  amortYears: number;             // amortization period (may differ from term)
  ioPeriodYears: number;          // interest-only period (optional; 0 = none)

  taxRateOnEBT: number;           // corporate tax rate %

  // Calculated (derived, persisted for audit but recomputed on load)
  loanAmount: number;
  equityRequired: number;
};

export type DebtScheduleMonth = {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
};

export type DebtScheduleResult = {
  months: DebtScheduleMonth[];
  monthlyPayment: number;         // during amortization period
  monthlyIOPayment: number;       // during IO period
  annualDebtService: number;      // first stabilized year
  balloonPayment: number;         // if any
  hasBalloon: boolean;
};