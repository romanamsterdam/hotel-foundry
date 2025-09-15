import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRooms(count: number): string {
  return `${count} room${count !== 1 ? 's' : ''}`;
}

export function formatOccupancy(percentage: number): string {
  return `${percentage}%`;
}

// ---- Date helpers ----
export function formatDate(
  iso: string | number | Date,
  locale: string = "en-GB",
  opts: Intl.DateTimeFormatOptions = {}
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const base: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  return d.toLocaleDateString(locale, { ...base, ...opts });
}

export function formatRelativeTime(iso: string | number | Date, locale: string = "en-GB"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000],
  ];

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, ms] of units) {
    const val = Math.round(abs / ms);
    if (val >= 1) return rtf.format(Math.sign(diffMs) * val, unit);
  }
  return "now";
}

export function formatCurrency(
  value: number,
  currency: "EUR" | "USD" | "GBP" = "EUR",
  locale = "en-GB"
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatNumberWithThousandsSeparator(value: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

// Safe array helper
export const safeArray = <T>(v: T[] | undefined | null): T[] =>
  Array.isArray(v) ? v.filter(Boolean) : [];

// ---- Last saved helper ----
export const lastSavedLabel = (iso?: string) => {
  if (!iso) return "never";
  const d = new Date(iso);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};