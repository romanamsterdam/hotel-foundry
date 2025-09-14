import { UWProgress, UWSectionId } from "../types/underwriting";

const KEY = (dealId: string) => `hf_uw_progress_${dealId}`;

export function loadProgress(dealId: string): UWProgress {
  const raw = localStorage.getItem(KEY(dealId));
  return raw ? JSON.parse(raw) : {} as UWProgress;
}

export function setCompleted(dealId: string, id: UWSectionId, completed: boolean) {
  const prog = loadProgress(dealId);
  prog[id] = { completed };
  localStorage.setItem(KEY(dealId), JSON.stringify(prog));
}

export function clearProgress(dealId: string) {
  localStorage.removeItem(KEY(dealId));
}