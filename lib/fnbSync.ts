import { FnBAdvanced, FnBSimple, MealKey, MealPeriod } from '../types/fnb';

export function advancedToSimple(adv: FnBAdvanced, avgGuestsPerOccRoom: number): FnBSimple {
  const sumCapture = Object.values(adv).reduce((s, m) => s + m.guestCapturePct, 0);
  
  const avgCheckGuest = sumCapture === 0 ? 0 :
    Object.values(adv).reduce((s, m) => s + m.guestCapturePct * m.avgCheckGuest, 0) / sumCapture;

  const extCoversPerDay = Object.values(adv).reduce((s, m) => s + m.externalCoversPerDay, 0);

  const avgCheckExternal = extCoversPerDay === 0 ? 0 :
    Object.values(adv).reduce((s, m) => s + m.externalCoversPerDay * m.avgCheckExternal, 0) / extCoversPerDay;

  return {
    avgGuestsPerOccRoom,
    totalGuestCapturePct: Math.min(sumCapture, 100),
    avgCheckGuest,
    externalCoversPerDay: extCoversPerDay,
    avgCheckExternal
  };
}

export function simpleToAdvanced(simple: FnBSimple, weights: Record<MealKey, number>): FnBAdvanced {
  const w = (k: MealKey) => (weights[k] ?? 0) / 100;
  
  const mk = (key: MealKey, label: string, icon: string): MealPeriod => ({
    key,
    label,
    icon,
    guestCapturePct: simple.totalGuestCapturePct * w(key),
    avgCheckGuest: simple.avgCheckGuest,            // same check across meals by default
    externalCoversPerDay: simple.externalCoversPerDay * w(key),
    avgCheckExternal: simple.avgCheckExternal
  });
  
  return {
    breakfast: mk("breakfast", "Breakfast", "☕"),
    lunch: mk("lunch", "Lunch", "🥗"),
    dinner: mk("dinner", "Dinner", "🍽️"),
    bar: mk("bar", "Bar", "🍷")
  };
}