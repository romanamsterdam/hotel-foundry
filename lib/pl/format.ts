import { formatCurrency as baseCurrency } from '../utils';

export type Scale = "full" | "thousands" | "millions";

export function getScaleDivisor(scale: Scale): number {
  switch (scale) {
    case "millions": return 1_000_000;
    case "thousands": return 1_000;
    default: return 1;
  }
}

export function formatScaledCurrency(value: number, currency: string, scale: Scale): string {
  const divisor = getScaleDivisor(scale);
  const scaledValue = value / divisor;
  return baseCurrency(scaledValue, currency);
}

export function scaleSuffix(scale: Scale): string {
  switch (scale) {
    case "millions": return " (Millions)";
    case "thousands": return " (Thousands)";
    default: return "";
  }
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatPorPar(value: number, currency: string): string {
  return baseCurrency(value, currency);
}