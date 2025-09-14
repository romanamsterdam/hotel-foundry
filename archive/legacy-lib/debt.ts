import { FinancingSettings, DebtScheduleResult, DebtScheduleMonth } from '../types/financing';

export function calculateFinancingAmounts(
  projectCost: number, 
  ltcPct: number
): { loanAmount: number; equityRequired: number } {
  const loanAmount = projectCost * (ltcPct / 100);
  const equityRequired = projectCost - loanAmount;
  
  return { loanAmount, equityRequired };
}

export function buildDebtSchedule(settings: FinancingSettings, projectCost: number): DebtScheduleResult {
  const { loanAmount } = calculateFinancingAmounts(projectCost, settings.ltcPct);
  
  if (loanAmount === 0) {
    return {
      months: [],
      monthlyPayment: 0,
      monthlyIOPayment: 0,
      annualDebtService: 0,
      balloonPayment: 0,
      hasBalloon: false
    };
  }

  const r = settings.interestRatePct / 100;
  const i = r / 12; // monthly rate
  const nAmort = settings.amortYears * 12;
  const nTerm = settings.loanTermYears * 12;
  const nIO = settings.ioPeriodYears * 12;

  // Calculate monthly payment during amortization
  const monthlyPayment = i === 0 ? loanAmount / nAmort : (loanAmount * i) / (1 - Math.pow(1 + i, -nAmort));
  const monthlyIOPayment = loanAmount * i;

  const months: DebtScheduleMonth[] = [];
  let balance = loanAmount;

  // Generate debt schedule
  for (let month = 1; month <= nTerm; month++) {
    let payment: number;
    let interest: number;
    let principal: number;

    if (month <= nIO) {
      // Interest-only period
      payment = monthlyIOPayment;
      interest = balance * i;
      principal = 0;
    } else {
      // Amortization period
      const amortMonth = month - nIO;
      if (amortMonth <= nAmort) {
        payment = monthlyPayment;
        interest = balance * i;
        principal = payment - interest;
        balance = Math.max(0, balance - principal);
      } else {
        // Beyond amortization period (balloon scenario)
        payment = 0;
        interest = 0;
        principal = 0;
      }
    }

    months.push({
      month,
      payment,
      interest,
      principal,
      balance: balance - principal
    });

    if (month > nIO && month - nIO <= nAmort) {
      balance -= principal;
    }
  }

  // Calculate annual debt service (first stabilized year)
  const firstYearPayments = months.slice(0, 12);
  const annualDebtService = firstYearPayments.reduce((sum, m) => sum + m.payment, 0);

  // Check for balloon payment
  const finalBalance = months[months.length - 1]?.balance || 0;
  const hasBalloon = finalBalance > 1000; // Consider balances > €1000 as balloon
  const balloonPayment = hasBalloon ? finalBalance : 0;

  return {
    months,
    monthlyPayment,
    monthlyIOPayment,
    annualDebtService,
    balloonPayment,
    hasBalloon
  };
}

export function monthlyDebtServiceByYear(
  settings: FinancingSettings, 
  projectCost: number, 
  year: number
): number {
  const schedule = buildDebtSchedule(settings, projectCost);
  const startMonth = (year - 1) * 12;
  const endMonth = year * 12;
  
  const yearPayments = schedule.months.slice(startMonth, endMonth);
  return yearPayments.reduce((sum, m) => sum + m.payment, 0) / 12;
}

export function loanBalanceAtEndOfYear(
  settings: FinancingSettings, 
  projectCost: number, 
  year: number
): number {
  const schedule = buildDebtSchedule(settings, projectCost);
  const monthIndex = year * 12 - 1;
  
  if (monthIndex >= schedule.months.length) {
    return 0;
  }
  
  return schedule.months[monthIndex]?.balance || 0;
}