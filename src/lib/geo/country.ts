export function toCountryCode(raw?: string): string | null {
  if (!raw) return null;
  
  // Simple country name to ISO-2 mapping
  const countryMap: Record<string, string> = {
    'spain': 'ES',
    'portugal': 'PT', 
    'italy': 'IT',
    'philippines': 'PH',
    'norway': 'NO',
    'morocco': 'MA',
    'switzerland': 'CH',
    'indonesia': 'ID',
    'croatia': 'HR'
  };
  
  const normalized = raw.trim().toLowerCase();
  
  // Check if it's already an ISO-2 code
  if (raw.length === 2) {
    return raw.toUpperCase();
  }
  
  // Map from country name
  return countryMap[normalized] || null;
}

export function getCountryName(countryCode: string): string {
  const nameMap: Record<string, string> = {
    'ES': 'Spain',
    'PT': 'Portugal',
    'IT': 'Italy', 
    'PH': 'Philippines',
    'NO': 'Norway',
    'MA': 'Morocco',
    'CH': 'Switzerland',
    'ID': 'Indonesia',
    'HR': 'Croatia'
  };
  
  return nameMap[countryCode.toUpperCase()] || countryCode;
}