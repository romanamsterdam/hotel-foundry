export const eur = (n: number) =>
  "€" + n.toLocaleString("en-IE", { maximumFractionDigits: 0 });

export const eur0 = (n: number) => "€" + n.toLocaleString("en-IE", { maximumFractionDigits: 0 });
export const dateShort = (iso: string) => new Date(iso).toLocaleDateString();

export const formatCurrency = (v?: number, currency: string = 'EUR') => 
  v == null ? '—' : new Intl.NumberFormat(undefined, { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: 0 
  }).format(v);

export const formatPercent = (v?: number) => 
  v == null ? '—' : `${(v * 100).toFixed(1)}%`;

export const isoToDate = (s?: string) => 
  s ? new Date(s).toLocaleDateString() : '—';

export function scaleAmount(v: number, unit: "FULL" | "K" | "M") { 
  return unit === "K" ? v / 1_000 : unit === "M" ? v / 1_000_000 : v; 
}

export function fmtCurrency(v: number, unit: "FULL" | "K" | "M", currency = "EUR") {
  const n = scaleAmount(v, unit);
  const formatted = new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency, 
    maximumFractionDigits: 0 
  }).format(n || 0);
  return formatted;
}

export function fmtPct(n: number) { 
  return `${(n * 100).toFixed(1)}%`; 
}