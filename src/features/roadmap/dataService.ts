// Swap between 'mock' and 'supabase' implementations via a simple flag.
const STORAGE_KEY = "hf_roadmap_store_v1";

import { RoadmapProject, RoadmapChapter, RoadmapStep, RoadmapSnapshot } from "./types";

type Store = {
  projects: RoadmapProject[];
  chapters: RoadmapChapter[];
  steps: RoadmapStep[];
  snapshots: RoadmapSnapshot[];
};

const seedProjectId = "proj-sample-001";
const seed: Store = {
  projects: [{
    id: seedProjectId,
    title: "Hotel Dev — Master Roadmap",
    version: 0,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: "Seed roadmap aligned to critical path (Vision → Feasibility → Concept Design → Contractor LOI → Acquisition → Financing → Detailed Design → Permits → Construction → Pre-Opening → Operations)."
  }],
  chapters: [
    { id: "c1", projectId: seedProjectId, order: 1, title: "Concept & Vision Development", description: "Brand DNA, positioning, anchor experiences." },
    { id: "c2", projectId: seedProjectId, order: 2, title: "Market Research & Feasibility", description: "Demand, comps, RevPAR, risks." },
    { id: "c3", projectId: seedProjectId, order: 3, title: "Concept Design & Masterplanning (Pre-Acq)", description: "Capacity study, masterplan, high-level interiors and cost." },
    { id: "c4", projectId: seedProjectId, order: 4, title: "Contractor Validation & LOI", description: "Turnkey vs GMP vs Cost+ validation." },
    { id: "c5", projectId: seedProjectId, order: 5, title: "Site Identification & Acquisition", description: "LOI, DD, purchase/lease/JV." },
    { id: "c6", projectId: seedProjectId, order: 6, title: "Business Planning & Financing", description: "Underwriting, equity, debt, SPV." },
    { id: "c7", projectId: seedProjectId, order: 7, title: "Detailed Design & Engineering", description: "DD → IFC, VE, code compliance." },
    { id: "c8", projectId: seedProjectId, order: 8, title: "Permitting & Approvals", description: "Zoning, environmental, fire/life safety." },
    { id: "c9", projectId: seedProjectId, order: 9, title: "Construction & Fit-Out", description: "Shell/core, MEP, FF&E, OS&E." },
    { id: "c10", projectId: seedProjectId, order: 10, title: "Pre-Opening Setup", description: "SOPs, PMS/POS, hiring, PR." },
    { id: "c11", projectId: seedProjectId, order: 11, title: "Soft Opening & Launch", description: "Trial ops, reviews, PR." },
    { id: "c12", projectId: seedProjectId, order: 12, title: "Year 1 Ops & Stabilization", description: "Ramp-up, GOP, community, review." }
  ],
  steps: [
    // Minimal seed; Admin will add 20-40 per chapter. Include a few samples & dependencies.
    { id: "s1", projectId: seedProjectId, chapterId: "c1", order: 1, title: "Define brand promise & guest DNA", status: "in_progress", percentComplete: 60, dependsOnIds: [], milestone: false, critical: true },
    { id: "s2", projectId: seedProjectId, chapterId: "c2", order: 1, title: "Competitive set analysis & pipeline", status: "not_started", dependsOnIds: ["s1"], milestone: false, critical: true },
    { id: "s3", projectId: seedProjectId, chapterId: "c3", order: 1, title: "Site capacity study & masterplan", status: "not_started", dependsOnIds: ["s2"], milestone: true, critical: true, files: [{ name: "CapacityStudy_v1.pdf", placeholderId: "file-ph-001" }] },
    { id: "s4", projectId: seedProjectId, chapterId: "c4", order: 1, title: "Contractor LOI (GMP/Cost+)", status: "not_started", dependsOnIds: ["s3"], milestone: true, critical: true },
    { id: "s5", projectId: seedProjectId, chapterId: "c5", order: 1, title: "Finalize site acquisition", status: "not_started", dependsOnIds: ["s4"], milestone: true, critical: true },
    { id: "s6", projectId: seedProjectId, chapterId: "c6", order: 1, title: "Debt & equity term sheets signed", status: "not_started", dependsOnIds: ["s5"], milestone: true, critical: true },
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

export const roadmapApi = {
  listProjects(): RoadmapProject[] { 
    return [...store.projects]; 
  },
  
  getProject(id: string): RoadmapProject | undefined { 
    return store.projects.find(p => p.id === id); 
  },
  
  upsertProject(p: RoadmapProject) {
    const ix = store.projects.findIndex(x => x.id === p.id);
    if (ix >= 0) store.projects[ix] = p; 
    else store.projects.push(p);
    save(store);
  },
  
  listChapters(projectId: string): RoadmapChapter[] {
    return store.chapters.filter(c => c.projectId === projectId).sort((a,b)=>a.order-b.order);
  },
  
  upsertChapter(c: RoadmapChapter) {
    const ix = store.chapters.findIndex(x => x.id === c.id);
    if (ix >= 0) store.chapters[ix] = c; 
    else store.chapters.push(c);
    save(store);
  },
  
  deleteChapter(id: string) {
    store.chapters = store.chapters.filter(c=>c.id!==id);
    store.steps = store.steps.filter(s=>s.chapterId!==id);
    save(store);
  },
  
  listSteps(projectId: string): RoadmapStep[] {
    return store.steps.filter(s => s.projectId === projectId).sort((a,b)=>a.order-b.order);
  },
  
  upsertStep(s: RoadmapStep) {
    const ix = store.steps.findIndex(x => x.id === s.id);
    if (ix >= 0) store.steps[ix] = s; 
    else store.steps.push(s);
    save(store);
  },
  
  deleteStep(id: string) {
    store.steps = store.steps.filter(s=>s.id!==id);
    // Remove it from others' dependencies
    store.steps = store.steps.map(s => ({...s, dependsOnIds: s.dependsOnIds.filter(d=>d!==id)}));
    save(store);
  },
  
  // Publish: create a snapshot and mark project as published
  publish(projectId: string): RoadmapSnapshot {
    const p = this.getProject(projectId);
    if (!p) throw new Error("Project not found");
    const chapters = this.listChapters(projectId);
    const steps = this.listSteps(projectId);
    const snapshot: RoadmapSnapshot = {
      project: { ...p, version: p.version + 1, status: "published", publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      chapters,
      steps,
      generatedAt: new Date().toISOString()
    };
    // update live project and save snapshot
    const ix = store.projects.findIndex(x=>x.id===projectId);
    store.projects[ix] = snapshot.project;
    store.snapshots.push(snapshot);
    save(store);
    return snapshot;
  },
  
  getLatestSnapshot(projectId: string): RoadmapSnapshot | undefined {
    const snaps = store.snapshots.filter(s=>s.project.id===projectId);
    return snaps.sort((a,b)=> (b.project.version)-(a.project.version))[0];
  }
};