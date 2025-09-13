import {
  BenchmarkSet, CapexBenchmark, OpexUsaliBenchmark, PayrollBenchmark, BenchmarkSnapshot
} from "./types";

const STORAGE_KEY = "hf_benchmarks_store_v1";

type Store = {
  sets: BenchmarkSet[];
  capex: CapexBenchmark[];
  opex: OpexUsaliBenchmark[];
  payroll: PayrollBenchmark[];
  snapshots: BenchmarkSnapshot[];
};

const seedSetId = "global-default";
const seed: Store = {
  sets: [{
    id: seedSetId, 
    title: "Global Defaults v1", 
    status: "draft", 
    version: 0,
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(),
    notes: "Starter ranges for CapEx (per-room), OPEX %, and Payroll by country."
  }],
  capex: [
    { 
      id: "cx1", 
      setId: seedSetId, 
      itemCode: "FF&E_GUESTROOM_STD", 
      itemName: "FF&E – Standard Room", 
      unit: "per_room", 
      low: 2500, 
      medium: 3500, 
      high: 4500, 
      currency: "EUR", 
      tags: ["rooms","ff&e"] 
    },
    { 
      id: "cx2", 
      setId: seedSetId, 
      itemCode: "OS&E_STARTUP", 
      itemName: "OS&E – Startup Kit", 
      unit: "per_room", 
      low: 600, 
      medium: 800, 
      high: 1200, 
      currency: "EUR", 
      tags: ["o&s","rooms"] 
    },
    { 
      id: "cx3", 
      setId: seedSetId, 
      itemCode: "SPA_BUILD_COST", 
      itemName: "Spa Construction", 
      unit: "per_sqm", 
      low: 800, 
      medium: 1200, 
      high: 1600, 
      currency: "EUR", 
      tags: ["spa","construction"] 
    },
    { 
      id: "cx4", 
      setId: seedSetId, 
      itemCode: "RESTAURANT_BUILD", 
      itemName: "Restaurant Build-out", 
      unit: "per_sqm", 
      low: 1000, 
      medium: 1500, 
      high: 2200, 
      currency: "EUR", 
      tags: ["fnb","construction"] 
    }
  ],
  opex: [
    { 
      id: "ox1", 
      setId: seedSetId, 
      department: "Rooms", 
      metric: "pct_of_total_revenue", 
      country: null, 
      band: "low", 
      value: 10, 
      valueType: "percent" 
    },
    { 
      id: "ox2", 
      setId: seedSetId, 
      department: "Rooms", 
      metric: "pct_of_total_revenue", 
      country: null, 
      band: "medium", 
      value: 12, 
      valueType: "percent" 
    },
    { 
      id: "ox3", 
      setId: seedSetId, 
      department: "Rooms", 
      metric: "pct_of_total_revenue", 
      country: null, 
      band: "high", 
      value: 15, 
      valueType: "percent" 
    },
    { 
      id: "ox4", 
      setId: seedSetId, 
      department: "Utilities", 
      metric: "pct_of_total_revenue", 
      country: null, 
      band: "medium", 
      value: 4, 
      valueType: "percent" 
    },
    { 
      id: "ox5", 
      setId: seedSetId, 
      department: "F&B", 
      metric: "pct_of_total_revenue", 
      country: null, 
      band: "medium", 
      value: 8, 
      valueType: "percent" 
    }
  ],
  payroll: [
    // --- EUROPE ----------------------------------------------------
    // Portugal (PT)
    { id: "pt_recep", setId: seedSetId, country: "PT", role: "Receptionist",  monthlyGrossLow: 800,  monthlyGrossMed: 1000, monthlyGrossHigh: 1200, currency: "EUR", includesBenefits: false },
    { id: "pt_house", setId: seedSetId, country: "PT", role: "Housekeeper",  monthlyGrossLow: 700,  monthlyGrossMed: 900,  monthlyGrossHigh: 1100, currency: "EUR", includesBenefits: false },
    { id: "pt_chef",  setId: seedSetId, country: "PT", role: "Chef de Partie",monthlyGrossLow: 1200, monthlyGrossMed: 1500, monthlyGrossHigh: 1800, currency: "EUR", includesBenefits: false },
    { id: "pt_fb",    setId: seedSetId, country: "PT", role: "F&B Manager",   monthlyGrossLow: 2000, monthlyGrossMed: 2500, monthlyGrossHigh: 3000, currency: "EUR", includesBenefits: false },
    { id: "pt_hm",    setId: seedSetId, country: "PT", role: "Hotel Manager", monthlyGrossLow: 2500, monthlyGrossMed: 3200, monthlyGrossHigh: 4000, currency: "EUR", includesBenefits: false },
    { id: "pt_gm",    setId: seedSetId, country: "PT", role: "General Manager",monthlyGrossLow: 4000, monthlyGrossMed: 5500, monthlyGrossHigh: 7000, currency: "EUR", includesBenefits: false },
    { id: "pt_spa",   setId: seedSetId, country: "PT", role: "Spa Therapist", monthlyGrossLow: 1000, monthlyGrossMed: 1200, monthlyGrossHigh: 1500, currency: "EUR", includesBenefits: false },

    // Spain (ES)
    { id: "es_recep", setId: seedSetId, country: "ES", role: "Receptionist",  monthlyGrossLow: 950,  monthlyGrossMed: 1150, monthlyGrossHigh: 1400, currency: "EUR", includesBenefits: false },
    { id: "es_house", setId: seedSetId, country: "ES", role: "Housekeeper",  monthlyGrossLow: 800,  monthlyGrossMed: 950,  monthlyGrossHigh: 1150, currency: "EUR", includesBenefits: false },
    { id: "es_chef",  setId: seedSetId, country: "ES", role: "Chef de Partie",monthlyGrossLow: 1300, monthlyGrossMed: 1600, monthlyGrossHigh: 1900, currency: "EUR", includesBenefits: false },
    { id: "es_fb",    setId: seedSetId, country: "ES", role: "F&B Manager",   monthlyGrossLow: 2200, monthlyGrossMed: 2800, monthlyGrossHigh: 3400, currency: "EUR", includesBenefits: false },
    { id: "es_hm",    setId: seedSetId, country: "ES", role: "Hotel Manager", monthlyGrossLow: 2800, monthlyGrossMed: 3500, monthlyGrossHigh: 4200, currency: "EUR", includesBenefits: false },
    { id: "es_gm",    setId: seedSetId, country: "ES", role: "General Manager",monthlyGrossLow: 4500, monthlyGrossMed: 6000, monthlyGrossHigh: 7500, currency: "EUR", includesBenefits: false },
    { id: "es_spa",   setId: seedSetId, country: "ES", role: "Spa Therapist", monthlyGrossLow: 1100, monthlyGrossMed: 1300, monthlyGrossHigh: 1600, currency: "EUR", includesBenefits: false },

    // Italy (IT)
    { id: "it_recep", setId: seedSetId, country: "IT", role: "Receptionist",  monthlyGrossLow: 1000, monthlyGrossMed: 1200, monthlyGrossHigh: 1500, currency: "EUR", includesBenefits: false },
    { id: "it_house", setId: seedSetId, country: "IT", role: "Housekeeper",  monthlyGrossLow: 850,  monthlyGrossMed: 1050, monthlyGrossHigh: 1250, currency: "EUR", includesBenefits: false },
    { id: "it_chef",  setId: seedSetId, country: "IT", role: "Chef de Partie",monthlyGrossLow: 1400, monthlyGrossMed: 1700, monthlyGrossHigh: 2000, currency: "EUR", includesBenefits: false },
    { id: "it_fb",    setId: seedSetId, country: "IT", role: "F&B Manager",   monthlyGrossLow: 2400, monthlyGrossMed: 3000, monthlyGrossHigh: 3600, currency: "EUR", includesBenefits: false },
    { id: "it_hm",    setId: seedSetId, country: "IT", role: "Hotel Manager", monthlyGrossLow: 3000, monthlyGrossMed: 3800, monthlyGrossHigh: 4600, currency: "EUR", includesBenefits: false },
    { id: "it_gm",    setId: seedSetId, country: "IT", role: "General Manager",monthlyGrossLow: 4800, monthlyGrossMed: 6500, monthlyGrossHigh: 8000, currency: "EUR", includesBenefits: false },
    { id: "it_spa",   setId: seedSetId, country: "IT", role: "Spa Therapist", monthlyGrossLow: 1200, monthlyGrossMed: 1400, monthlyGrossHigh: 1700, currency: "EUR", includesBenefits: false },

    // France (FR)
    { id: "fr_recep", setId: seedSetId, country: "FR", role: "Receptionist",  monthlyGrossLow: 1500, monthlyGrossMed: 1700, monthlyGrossHigh: 1900, currency: "EUR", includesBenefits: false },
    { id: "fr_house", setId: seedSetId, country: "FR", role: "Housekeeper",  monthlyGrossLow: 1300, monthlyGrossMed: 1500, monthlyGrossHigh: 1700, currency: "EUR", includesBenefits: false },
    { id: "fr_chef",  setId: seedSetId, country: "FR", role: "Chef de Partie",monthlyGrossLow: 1800, monthlyGrossMed: 2050, monthlyGrossHigh: 2300, currency: "EUR", includesBenefits: false },
    { id: "fr_fb",    setId: seedSetId, country: "FR", role: "F&B Manager",   monthlyGrossLow: 2800, monthlyGrossMed: 3200, monthlyGrossHigh: 3600, currency: "EUR", includesBenefits: false },
    { id: "fr_hm",    setId: seedSetId, country: "FR", role: "Hotel Manager", monthlyGrossLow: 3500, monthlyGrossMed: 4000, monthlyGrossHigh: 4500, currency: "EUR", includesBenefits: false },
    { id: "fr_gm",    setId: seedSetId, country: "FR", role: "General Manager",monthlyGrossLow: 6000, monthlyGrossMed: 7000, monthlyGrossHigh: 8000, currency: "EUR", includesBenefits: false },
    { id: "fr_spa",   setId: seedSetId, country: "FR", role: "Spa Therapist", monthlyGrossLow: 1400, monthlyGrossMed: 1600, monthlyGrossHigh: 1800, currency: "EUR", includesBenefits: false },

    // Germany (DE)
    { id: "de_recep", setId: seedSetId, country: "DE", role: "Receptionist",  monthlyGrossLow: 1700, monthlyGrossMed: 1900, monthlyGrossHigh: 2100, currency: "EUR", includesBenefits: false },
    { id: "de_house", setId: seedSetId, country: "DE", role: "Housekeeper",  monthlyGrossLow: 1400, monthlyGrossMed: 1600, monthlyGrossHigh: 1800, currency: "EUR", includesBenefits: false },
    { id: "de_chef",  setId: seedSetId, country: "DE", role: "Chef de Partie",monthlyGrossLow: 2000, monthlyGrossMed: 2250, monthlyGrossHigh: 2500, currency: "EUR", includesBenefits: false },
    { id: "de_fb",    setId: seedSetId, country: "DE", role: "F&B Manager",   monthlyGrossLow: 3200, monthlyGrossMed: 3600, monthlyGrossHigh: 4000, currency: "EUR", includesBenefits: false },
    { id: "de_hm",    setId: seedSetId, country: "DE", role: "Hotel Manager", monthlyGrossLow: 3800, monthlyGrossMed: 4400, monthlyGrossHigh: 5000, currency: "EUR", includesBenefits: false },
    { id: "de_gm",    setId: seedSetId, country: "DE", role: "General Manager",monthlyGrossLow: 6500, monthlyGrossMed: 7800, monthlyGrossHigh: 9000, currency: "EUR", includesBenefits: false },
    { id: "de_spa",   setId: seedSetId, country: "DE", role: "Spa Therapist", monthlyGrossLow: 1500, monthlyGrossMed: 1700, monthlyGrossHigh: 1900, currency: "EUR", includesBenefits: false },

    // Netherlands (NL)
    { id: "nl_recep", setId: seedSetId, country: "NL", role: "Receptionist",  monthlyGrossLow: 1700, monthlyGrossMed: 1950, monthlyGrossHigh: 2200, currency: "EUR", includesBenefits: false },
    { id: "nl_house", setId: seedSetId, country: "NL", role: "Housekeeper",  monthlyGrossLow: 1500, monthlyGrossMed: 1700, monthlyGrossHigh: 1900, currency: "EUR", includesBenefits: false },
    { id: "nl_chef",  setId: seedSetId, country: "NL", role: "Chef de Partie",monthlyGrossLow: 2100, monthlyGrossMed: 2350, monthlyGrossHigh: 2600, currency: "EUR", includesBenefits: false },
    { id: "nl_fb",    setId: seedSetId, country: "NL", role: "F&B Manager",   monthlyGrossLow: 3300, monthlyGrossMed: 3750, monthlyGrossHigh: 4200, currency: "EUR", includesBenefits: false },
    { id: "nl_hm",    setId: seedSetId, country: "NL", role: "Hotel Manager", monthlyGrossLow: 4000, monthlyGrossMed: 4600, monthlyGrossHigh: 5200, currency: "EUR", includesBenefits: false },
    { id: "nl_gm",    setId: seedSetId, country: "NL", role: "General Manager",monthlyGrossLow: 7000, monthlyGrossMed: 8200, monthlyGrossHigh: 9500, currency: "EUR", includesBenefits: false },
    { id: "nl_spa",   setId: seedSetId, country: "NL", role: "Spa Therapist", monthlyGrossLow: 1600, monthlyGrossMed: 1800, monthlyGrossHigh: 2000, currency: "EUR", includesBenefits: false },

    // Greece (GR)
    { id: "gr_recep", setId: seedSetId, country: "GR", role: "Receptionist",  monthlyGrossLow: 800,  monthlyGrossMed: 1000, monthlyGrossHigh: 1200, currency: "EUR", includesBenefits: false },
    { id: "gr_house", setId: seedSetId, country: "GR", role: "Housekeeper",  monthlyGrossLow: 700,  monthlyGrossMed: 900,  monthlyGrossHigh: 1100, currency: "EUR", includesBenefits: false },
    { id: "gr_chef",  setId: seedSetId, country: "GR", role: "Chef de Partie",monthlyGrossLow: 1100, monthlyGrossMed: 1400, monthlyGrossHigh: 1700, currency: "EUR", includesBenefits: false },
    { id: "gr_fb",    setId: seedSetId, country: "GR", role: "F&B Manager",   monthlyGrossLow: 1800, monthlyGrossMed: 2300, monthlyGrossHigh: 2800, currency: "EUR", includesBenefits: false },
    { id: "gr_hm",    setId: seedSetId, country: "GR", role: "Hotel Manager", monthlyGrossLow: 2200, monthlyGrossMed: 2700, monthlyGrossHigh: 3600, currency: "EUR", includesBenefits: false },
    { id: "gr_gm",    setId: seedSetId, country: "GR", role: "General Manager",monthlyGrossLow: 3500, monthlyGrossMed: 4500, monthlyGrossHigh: 6500, currency: "EUR", includesBenefits: false },
    { id: "gr_spa",   setId: seedSetId, country: "GR", role: "Spa Therapist", monthlyGrossLow: 900,  monthlyGrossMed: 1100, monthlyGrossHigh: 1300, currency: "EUR", includesBenefits: false },

    // --- ASIA ------------------------------------------------------
    // Philippines (PH)
    { id: "ph_recep", setId: seedSetId, country: "PH", role: "Receptionist",  monthlyGrossLow: 350,  monthlyGrossMed: 450,  monthlyGrossHigh: 600,  currency: "EUR", includesBenefits: false },
    { id: "ph_house", setId: seedSetId, country: "PH", role: "Housekeeper",  monthlyGrossLow: 300,  monthlyGrossMed: 400,  monthlyGrossHigh: 500,  currency: "EUR", includesBenefits: false },
    { id: "ph_chef",  setId: seedSetId, country: "PH", role: "Chef de Partie",monthlyGrossLow: 500,  monthlyGrossMed: 700,  monthlyGrossHigh: 900,  currency: "EUR", includesBenefits: false },
    { id: "ph_fb",    setId: seedSetId, country: "PH", role: "F&B Manager",   monthlyGrossLow: 900,  monthlyGrossMed: 1200, monthlyGrossHigh: 1500, currency: "EUR", includesBenefits: false },
    { id: "ph_hm",    setId: seedSetId, country: "PH", role: "Hotel Manager", monthlyGrossLow: 1200, monthlyGrossMed: 1600, monthlyGrossHigh: 2000, currency: "EUR", includesBenefits: false },
    { id: "ph_gm",    setId: seedSetId, country: "PH", role: "General Manager",monthlyGrossLow: 2000, monthlyGrossMed: 3000, monthlyGrossHigh: 4000, currency: "EUR", includesBenefits: false },
    { id: "ph_spa",   setId: seedSetId, country: "PH", role: "Spa Therapist", monthlyGrossLow: 400,  monthlyGrossMed: 550,  monthlyGrossHigh: 700,  currency: "EUR", includesBenefits: false },

    // Thailand (TH)
    { id: "th_recep", setId: seedSetId, country: "TH", role: "Receptionist",  monthlyGrossLow: 450,  monthlyGrossMed: 600,  monthlyGrossHigh: 800,  currency: "EUR", includesBenefits: false },
    { id: "th_house", setId: seedSetId, country: "TH", role: "Housekeeper",  monthlyGrossLow: 400,  monthlyGrossMed: 550,  monthlyGrossHigh: 700,  currency: "EUR", includesBenefits: false },
    { id: "th_chef",  setId: seedSetId, country: "TH", role: "Chef de Partie",monthlyGrossLow: 700,  monthlyGrossMed: 900,  monthlyGrossHigh: 1200, currency: "EUR", includesBenefits: false },
    { id: "th_fb",    setId: seedSetId, country: "TH", role: "F&B Manager",   monthlyGrossLow: 1200, monthlyGrossMed: 1600, monthlyGrossHigh: 2000, currency: "EUR", includesBenefits: false },
    { id: "th_hm",    setId: seedSetId, country: "TH", role: "Hotel Manager", monthlyGrossLow: 1500, monthlyGrossMed: 2000, monthlyGrossHigh: 2600, currency: "EUR", includesBenefits: false },
    { id: "th_gm",    setId: seedSetId, country: "TH", role: "General Manager",monthlyGrossLow: 2500, monthlyGrossMed: 3500, monthlyGrossHigh: 4500, currency: "EUR", includesBenefits: false },
    { id: "th_spa",   setId: seedSetId, country: "TH", role: "Spa Therapist", monthlyGrossLow: 500,  monthlyGrossMed: 700,  monthlyGrossHigh: 900,  currency: "EUR", includesBenefits: false },

    // Indonesia (ID)
    { id: "id_recep", setId: seedSetId, country: "ID", role: "Receptionist",  monthlyGrossLow: 400,  monthlyGrossMed: 550,  monthlyGrossHigh: 750,  currency: "EUR", includesBenefits: false },
    { id: "id_house", setId: seedSetId, country: "ID", role: "Housekeeper",  monthlyGrossLow: 350,  monthlyGrossMed: 500,  monthlyGrossHigh: 650,  currency: "EUR", includesBenefits: false },
    { id: "id_chef",  setId: seedSetId, country: "ID", role: "Chef de Partie",monthlyGrossLow: 650,  monthlyGrossMed: 850,  monthlyGrossHigh: 1100, currency: "EUR", includesBenefits: false },
    { id: "id_fb",    setId: seedSetId, country: "ID", role: "F&B Manager",   monthlyGrossLow: 1100, monthlyGrossMed: 1500, monthlyGrossHigh: 1900, currency: "EUR", includesBenefits: false },
    { id: "id_hm",    setId: seedSetId, country: "ID", role: "Hotel Manager", monthlyGrossLow: 1400, monthlyGrossMed: 1900, monthlyGrossHigh: 2500, currency: "EUR", includesBenefits: false },
    { id: "id_gm",    setId: seedSetId, country: "ID", role: "General Manager",monthlyGrossLow: 2300, monthlyGrossMed: 3200, monthlyGrossHigh: 4200, currency: "EUR", includesBenefits: false },
    { id: "id_spa",   setId: seedSetId, country: "ID", role: "Spa Therapist", monthlyGrossLow: 450,  monthlyGrossMed: 600,  monthlyGrossHigh: 800,  currency: "EUR", includesBenefits: false },

    // Vietnam (VN)
    { id: "vn_recep", setId: seedSetId, country: "VN", role: "Receptionist",  monthlyGrossLow: 400,  monthlyGrossMed: 550,  monthlyGrossHigh: 700,  currency: "EUR", includesBenefits: false },
    { id: "vn_house", setId: seedSetId, country: "VN", role: "Housekeeper",  monthlyGrossLow: 350,  monthlyGrossMed: 500,  monthlyGrossHigh: 650,  currency: "EUR", includesBenefits: false },
    { id: "vn_chef",  setId: seedSetId, country: "VN", role: "Chef de Partie",monthlyGrossLow: 600,  monthlyGrossMed: 800,  monthlyGrossHigh: 1050, currency: "EUR", includesBenefits: false },
    { id: "vn_fb",    setId: seedSetId, country: "VN", role: "F&B Manager",   monthlyGrossLow: 1000, monthlyGrossMed: 1400, monthlyGrossHigh: 1800, currency: "EUR", includesBenefits: false },
    { id: "vn_hm",    setId: seedSetId, country: "VN", role: "Hotel Manager", monthlyGrossLow: 1300, monthlyGrossMed: 1800, monthlyGrossHigh: 2400, currency: "EUR", includesBenefits: false },
    { id: "vn_gm",    setId: seedSetId, country: "VN", role: "General Manager",monthlyGrossLow: 2200, monthlyGrossMed: 3000, monthlyGrossHigh: 4000, currency: "EUR", includesBenefits: false },
    { id: "vn_spa",   setId: seedSetId, country: "VN", role: "Spa Therapist", monthlyGrossLow: 450,  monthlyGrossMed: 600,  monthlyGrossHigh: 750,  currency: "EUR", includesBenefits: false },

    // Malaysia (MY)
    { id: "my_recep", setId: seedSetId, country: "MY", role: "Receptionist",  monthlyGrossLow: 600,  monthlyGrossMed: 800,  monthlyGrossHigh: 1000, currency: "EUR", includesBenefits: false },
    { id: "my_house", setId: seedSetId, country: "MY", role: "Housekeeper",  monthlyGrossLow: 500,  monthlyGrossMed: 700,  monthlyGrossHigh: 900,  currency: "EUR", includesBenefits: false },
    { id: "my_chef",  setId: seedSetId, country: "MY", role: "Chef de Partie",monthlyGrossLow: 900,  monthlyGrossMed: 1200, monthlyGrossHigh: 1500, currency: "EUR", includesBenefits: false },
    { id: "my_fb",    setId: seedSetId, country: "MY", role: "F&B Manager",   monthlyGrossLow: 1500, monthlyGrossMed: 2000, monthlyGrossHigh: 2500, currency: "EUR", includesBenefits: false },
    { id: "my_hm",    setId: seedSetId, country: "MY", role: "Hotel Manager", monthlyGrossLow: 2000, monthlyGrossMed: 2600, monthlyGrossHigh: 3200, currency: "EUR", includesBenefits: false },
    { id: "my_gm",    setId: seedSetId, country: "MY", role: "General Manager",monthlyGrossLow: 3500, monthlyGrossMed: 4800, monthlyGrossHigh: 6200, currency: "EUR", includesBenefits: false },
    { id: "my_spa",   setId: seedSetId, country: "MY", role: "Spa Therapist", monthlyGrossLow: 700,  monthlyGrossMed: 900,  monthlyGrossHigh: 1100, currency: "EUR", includesBenefits: false }
  ],
  snapshots: []
};

function load(): Store {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); 
    return seed; 
  }
  return JSON.parse(raw);
}

function save(s: Store) { 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); 
}

let store = load();

export const benchmarksApi = {
  listSets(): BenchmarkSet[] { 
    return [...store.sets]; 
  },
  
  getSet(id: string): BenchmarkSet | undefined { 
    return store.sets.find(s => s.id === id); 
  },
  
  upsertSet(s: BenchmarkSet) {
    const ix = store.sets.findIndex(x => x.id === s.id);
    if (ix >= 0) store.sets[ix] = s; 
    else store.sets.push(s);
    save(store);
  },

  // CapEx
  listCapex(setId: string): CapexBenchmark[] { 
    return store.capex.filter(x => x.setId === setId); 
  },
  
  upsertCapex(x: CapexBenchmark) {
    const ix = store.capex.findIndex(a => a.id === x.id);
    if (ix >= 0) store.capex[ix] = x; 
    else store.capex.push(x);
    save(store);
  },
  
  deleteCapex(id: string) { 
    store.capex = store.capex.filter(x => x.id !== id); 
    save(store); 
  },

  // OpEx
  listOpex(setId: string): OpexUsaliBenchmark[] { 
    return store.opex.filter(x => x.setId === setId); 
  },
  
  upsertOpex(x: OpexUsaliBenchmark) {
    const ix = store.opex.findIndex(a => a.id === x.id);
    if (ix >= 0) store.opex[ix] = x; 
    else store.opex.push(x);
    save(store);
  },
  
  deleteOpex(id: string) { 
    store.opex = store.opex.filter(x => x.id !== id); 
    save(store); 
  },

  // Payroll
  listPayroll(setId: string): PayrollBenchmark[] { 
    return store.payroll.filter(x => x.setId === setId); 
  },
  
  upsertPayroll(x: PayrollBenchmark) {
    const ix = store.payroll.findIndex(a => a.id === x.id);
    if (ix >= 0) store.payroll[ix] = x; 
    else store.payroll.push(x);
    save(store);
  },
  
  deletePayroll(id: string) { 
    store.payroll = store.payroll.filter(x => x.id !== id); 
    save(store); 
  },

  publish(setId: string): BenchmarkSnapshot {
    const set = this.getSet(setId);
    if (!set) throw new Error("Set not found");
    
    const snap: BenchmarkSnapshot = {
      set: { 
        ...set, 
        status: "published", 
        version: set.version + 1, 
        publishedAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      },
      capex: this.listCapex(setId),
      opex: this.listOpex(setId),
      payroll: this.listPayroll(setId),
      generatedAt: new Date().toISOString()
    };
    
    const ix = store.sets.findIndex(x => x.id === setId);
    store.sets[ix] = snap.set;
    store.snapshots.push(snap);
    save(store);
    return snap;
  },

  getLatestSnapshot(setId: string): BenchmarkSnapshot | undefined {
    return store.snapshots
      .filter(s => s.set.id === setId)
      .sort((a, b) => b.set.version - a.set.version)[0];
  },

  // Consumer helpers
  resolveCapex({ setId, itemCode, country }: { 
    setId: string; 
    itemCode: string; 
    country?: string | null; 
  }): CapexBenchmark | undefined {
    const list = this.listCapex(setId);
    // Prefer country match, else global (null)
    return list.find(x => x.itemCode === itemCode && x.country === country) ?? 
           list.find(x => x.itemCode === itemCode && !x.country);
  },

  resolvePayroll({ setId, country, role }: { 
    setId: string; 
    country: string; 
    role: string; 
  }): PayrollBenchmark | undefined {
    return this.listPayroll(setId).find(x => x.country === country && x.role === role);
  },

  resolveOpex({ setId, department, band = "medium", country = null }: { 
    setId: string; 
    department: string; 
    band?: LevelBand; 
    country?: string | null; 
  }): OpexUsaliBenchmark | undefined {
    const list = this.listOpex(setId);
    return list.find(x => x.department === department && x.band === band && x.country === country) ??
           list.find(x => x.department === department && x.band === band && !x.country);
  }
};