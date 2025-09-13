import { create } from "zustand";
import { benchmarksApi } from "./dataService";
import type { BenchmarkSet, CapexBenchmark, OpexUsaliBenchmark, PayrollBenchmark, BenchmarkSnapshot } from "./types";

type State = {
  sets: BenchmarkSet[];
  currentSetId: string | null;
  capex: CapexBenchmark[];
  opex: OpexUsaliBenchmark[];
  payroll: PayrollBenchmark[];
  snapshot?: BenchmarkSnapshot;

  refresh: () => void;
  setCurrentSet: (id: string) => void;

  upsertSet: (s: BenchmarkSet) => void;
  publish: () => void;

  upsertCapex: (x: CapexBenchmark) => void;
  deleteCapex: (id: string) => void;

  upsertOpex: (x: OpexUsaliBenchmark) => void;
  deleteOpex: (id: string) => void;

  upsertPayroll: (x: PayrollBenchmark) => void;
  deletePayroll: (id: string) => void;
};

export const useBenchmarksStore = create<State>((set, get) => ({
  sets: benchmarksApi.listSets(),
  currentSetId: benchmarksApi.listSets()[0]?.id ?? null,
  capex: [],
  opex: [],
  payroll: [],
  snapshot: undefined,

  refresh: () => {
    const id = get().currentSetId;
    if (!id) return;
    set({
      sets: benchmarksApi.listSets(),
      capex: benchmarksApi.listCapex(id),
      opex: benchmarksApi.listOpex(id),
      payroll: benchmarksApi.listPayroll(id),
      snapshot: benchmarksApi.getLatestSnapshot(id)
    });
  },

  setCurrentSet: (id) => { 
    set({ currentSetId: id }); 
    get().refresh(); 
  },

  upsertSet: (s) => { 
    benchmarksApi.upsertSet(s); 
    get().refresh(); 
  },
  
  publish: () => { 
    const id = get().currentSetId; 
    if (!id) return; 
    benchmarksApi.publish(id); 
    get().refresh(); 
  },

  upsertCapex: (x) => { 
    benchmarksApi.upsertCapex(x); 
    get().refresh(); 
  },
  
  deleteCapex: (id) => { 
    benchmarksApi.deleteCapex(id); 
    get().refresh(); 
  },

  upsertOpex: (x) => { 
    benchmarksApi.upsertOpex(x); 
    get().refresh(); 
  },
  
  deleteOpex: (id) => { 
    benchmarksApi.deleteOpex(id); 
    get().refresh(); 
  },

  upsertPayroll: (x) => { 
    benchmarksApi.upsertPayroll(x); 
    get().refresh(); 
  },
  
  deletePayroll: (id) => { 
    benchmarksApi.deletePayroll(id); 
    get().refresh(); 
  },
}));