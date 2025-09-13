import type { ConsultingRequest, ConsultingStatus } from "./types";

const KEY = "hf_consulting_v2"; // bumped to avoid mixing old enum

type Store = { requests: ConsultingRequest[] };

function loadV1(): Store {
  try { 
    const raw = localStorage.getItem("hf_consulting_v1");
    if (!raw) return { requests: [] };
    const v1 = JSON.parse(raw);
    // Map any old statuses to "unread"
    const requests: ConsultingRequest[] = (v1.requests || []).map((r: any) => ({
      ...r,
      status: "unread",
      consultant: r.consultant ?? "",
    }));
    return { requests };
  } catch { 
    return { requests: [] }; 
  }
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    // migrate v1 if exists
    const v1 = loadV1();
    if (v1.requests.length) save(v1);
    return v1;
  } catch { return { requests: [] }; }
}

function save(s: Store) { 
  localStorage.setItem(KEY, JSON.stringify(s)); 
}

let store = load();

export const consultingApi = {
  create(input: Omit<ConsultingRequest, "id" | "createdAt" | "status" | "hourlyRate">): ConsultingRequest {
    const req: ConsultingRequest = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "unread",
      hourlyRate: 150,
      consultant: "",
      ...input,
    };
    store.requests.unshift(req);
    save(store);
    return req;
  },
  
  list(): ConsultingRequest[] {
    return store.requests.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },
  
  updateStatus(id: string, status: ConsultingStatus) {
    const i = store.requests.findIndex(r => r.id === id);
    if (i >= 0) { 
      store.requests[i].status = status; 
      save(store); 
    }
  },

  setConsultant(id: string, name: string) {
    const i = store.requests.findIndex(r => r.id === id);
    if (i >= 0) {
      store.requests[i].consultant = name;
      save(store);
    }
  }
};

// TODO Supabase
// table consulting_requests:
//  id uuid pk, user_id uuid, name text, email text,
//  area text[], message text, hours_requested int, hourly_rate numeric,
//  status text, consultant text, created_at timestamptz default now()
// RLS: admin can read/update all; user can read own. Edge Function to send proposal emails.