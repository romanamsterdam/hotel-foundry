type MockProfile = { name?: string; email?: string };

const KEY_PROFILE = "hf:mock:profile";
const KEY_TIER = "hf:mock:tier";

export function getMockProfile(): MockProfile | null {
  try { 
    return JSON.parse(localStorage.getItem(KEY_PROFILE) || "null"); 
  } catch { 
    return null; 
  }
}

export function setMockProfile(p: MockProfile) {
  localStorage.setItem(KEY_PROFILE, JSON.stringify(p || {}));
}

export function getMockTier(): string | null {
  return localStorage.getItem(KEY_TIER);
}

export function setMockTier(tier: string) {
  localStorage.setItem(KEY_TIER, tier);
}