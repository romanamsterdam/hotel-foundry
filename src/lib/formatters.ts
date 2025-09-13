// Shared formatting utilities for preset cards and budget components

export function formatPresetSublabel(
  type: 'perSqm' | 'perRoom' | 'percent',
  val: number,
  currency: string = 'EUR'
): string {
  if (type === 'percent') return `${val}%`;
  if (type === 'perSqm') return `€${val.toLocaleString()}/sqm`;
  // perRoom
  return `€${val.toLocaleString()}/room`;
}

export function formatPresetCalculation(
  type: 'perSqm' | 'perRoom' | 'percent',
  presetValue: number,
  multiplier: number,
  currency: string = 'EUR'
): string {
  if (type === 'percent') {
    return `${presetValue}% × ${formatCurrency(multiplier, currency)}`;
  }
  if (type === 'perSqm') {
    return `€${presetValue.toLocaleString()} × ${multiplier.toLocaleString()} sqm`;
  }
  // perRoom
  return `€${presetValue.toLocaleString()} × ${multiplier} rooms`;
}

export function formatCurrency(
  value: number,
  currency: string = 'EUR',
  locale: string = 'en-GB'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export type Scale = "full" | "thousands" | "millions";

export function getScaleDivisor(scale: Scale) {
  switch (scale) {
    case "millions": return 1_000_000;
    case "thousands": return 1_000;
    default: return 1;
  }
}

export function formatScaledCurrency(value: number, currency: string, scale: Scale) {
  const div = getScaleDivisor(scale);
  return formatCurrency(value / div, currency);
}

export function scaleSuffix(scale: Scale) {
  if (scale === "millions") return " (Millions)";
  if (scale === "thousands") return " (Thousands)";
  return "";
}