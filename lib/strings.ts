export const asStr = (v: unknown, fb = ""): string =>
  typeof v === "string" ? v : fb;

export const getInitials = (name?: string, fallback = "P"): string =>
  asStr(name, fallback)
    .trim()
    .split(/\s+/)           // safe on empty string
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const safeLocation = (city?: string, country?: string): string => {
  const parts = [asStr(city), asStr(country)].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location TBD";
};