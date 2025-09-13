import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ConsultingRequest, ConsultingStatus } from "../../types/consulting";
import { SEED_CONSULTING } from "../../data/seedConsulting";

// Toggle to flush seed only once on empty storage
const STORAGE_KEY = "hf_consulting_requests_v1";

type State = {
  items: ConsultingRequest[];
  loading: boolean;
  error?: string;
  // query state
  q: string;
  statusFilter: "all" | ConsultingStatus;
  unreadOnly: boolean;
};

type Actions = {
  init: () => void;
  setQuery: (q: string) => void;
  setStatusFilter: (s: State["statusFilter"]) => void;
  setUnreadOnly: (v: boolean) => void;

  setAssignee: (id: string, name: string) => void;
  setStatus: (id: string, status: ConsultingStatus) => void;
  toggleUnread: (id: string) => void;
  add: (req: ConsultingRequest) => void;
  remove: (id: string) => void;

  // Supabase stubs for later wiring
  syncFromSupabase: () => Promise<void>;
  syncToSupabase: () => Promise<void>;
};

export const useConsultingStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      q: "",
      statusFilter: "all",
      unreadOnly: false,

      init: () => {
        const has = (get().items?.length ?? 0) > 0;
        if (!has) {
          set({ items: SEED_CONSULTING });
        }
      },

      setQuery: (q) => set({ q }),
      setStatusFilter: (s) => set({ statusFilter: s }),
      setUnreadOnly: (v) => set({ unreadOnly: v }),

      setAssignee: (id, name) =>
        set(({ items }) => ({
          items: items.map((it) => (it.id === id ? { ...it, assignee: name } : it))
        })),

      setStatus: (id, status) =>
        set(({ items }) => ({
          items: items.map((it) =>
            it.id === id ? { ...it, status, unread: status === "unread" ? true : false } : it
          )
        })),

      toggleUnread: (id) =>
        set(({ items }) => ({
          items: items.map((it) =>
            it.id === id ? { ...it, unread: !it.unread } : it
          )
        })),

      add: (req) => set(({ items }) => ({ items: [req, ...items] })),
      remove: (id) => set(({ items }) => ({ items: items.filter((i) => i.id !== id) })),

      // Wire these to Supabase later
      syncFromSupabase: async () => {
        // TODO: fetch from supabase and set({ items: rows })
      },
      syncToSupabase: async () => {
        // TODO: upsert to supabase
      }
    }),
    { name: STORAGE_KEY }
  )
);