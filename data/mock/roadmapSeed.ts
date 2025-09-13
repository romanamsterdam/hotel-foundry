import type { Project, ProjectRoadmap, StepStatus } from "../../types/roadmap";

export const MOCK_PROJECTS: Project[] = [
  { id: "p-sample-1", name: "Siargao Beach Bungalows", country: "PH", city: "Siargao" },
  { id: "p-sample-2", name: "Lisbon Alfama Microhotel", country: "PT", city: "Lisbon" },
];

const phases = [
  { id: "phase-ideation", title: "Ideation & Market", order: 1 },
  { id: "phase-underwriting", title: "Underwriting", order: 2 },
  { id: "phase-financing", title: "Financing", order: 3 },
  { id: "phase-acquisition", title: "Acquisition", order: 4 },
  { id: "phase-development", title: "Development", order: 5 },
  { id: "phase-preopening", title: "Pre-Opening", order: 6 },
];

function step(id: string, title: string, phaseId: string, status: StepStatus = "Todo", owner?: string, dueOffsetDays = 7) {
  const due = new Date(Date.now() + dueOffsetDays * 86400000).toISOString().slice(0,10);
  return { id, title, phaseId, status, owner, dueDate: due, comments: [] };
}

const steps = [
  step("opportunity-scan","Opportunity scan","phase-ideation"),
  step("market-snapshot","Market snapshot","phase-ideation"),
  step("initial-model","Initial model build","phase-underwriting"),
  step("sensitivity","Sensitivity checks","phase-underwriting"),
  step("cap-structure","Capital structure","phase-financing"),
  step("term-sheet","Term sheet draft","phase-financing"),
  step("loi","LOI negotiation","phase-acquisition"),
  step("dd","Due diligence","phase-acquisition"),
  step("design-brief","Design brief","phase-development"),
  step("gc-bid","GC bid","phase-development"),
  step("os&e","OS&E procurement","phase-preopening"),
  step("hiring","Hiring plan","phase-preopening"),
];

export function seedRoadmap(projectId: string): ProjectRoadmap {
  return {
    projectId,
    phases,
    steps: steps.map((s, i) => ({ ...s, id: `${s.id}-${projectId}-${i}` })),
    version: 0,
    updatedAt: new Date().toISOString(),
  };
}