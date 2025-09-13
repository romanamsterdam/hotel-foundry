import { create } from "zustand";
import { consultingApi } from "./dataService";
import type { ConsultingRequest, ConsultingStatus } from "./types";

type State = {
  items: ConsultingRequest[];
  refresh: () => void;
  submit: (payload: Omit<ConsultingRequest, "id" | "createdAt" | "status" | "hourlyRate">) => ConsultingRequest;
  setStatus: (id: string, s: ConsultingStatus) => void;
  setConsultant: (id: string, name: string) => void; // NEW
};

export const useConsulting = create<State>((set) => ({
  items: consultingApi.list(),
  
  refresh: () => set({ items: consultingApi.list() }),
  
  submit: (payload) => {
    const r = consultingApi.create(payload);
    set({ items: consultingApi.list() });
    return r;
  },
  
  setStatus: (id, s) => {
    consultingApi.updateStatus(id, s);
    set({ items: consultingApi.list() });
  },
  
  setConsultant: (id, name) => {
    consultingApi.setConsultant(id, name);
    set({ items: consultingApi.list() });
  }
}));