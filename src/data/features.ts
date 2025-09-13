import {
  Calculator,
  TrendingUp,
  BarChart3,
  Database,
  FileSpreadsheet,
  Map,
  ClipboardList,
  Users2
} from "lucide-react";

export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  comingSoon?: boolean;
};

export const features: Feature[] = [
  {
    id: "usali",
    title: "USALI-ready P&L",
    description:
      "Departmental / Undistributed / Fixed with FF&E reserves. Built for hospitality accounting standards.",
    icon: Calculator
  },
  {
    id: "endtoend",
    title: "End-to-end underwriting",
    description:
      "From topline projections to debt service, IRR calculations and DSCR analysis in one platform.",
    icon: TrendingUp
  },
  {
    id: "sensitivity",
    title: "Sensitivity grids",
    description:
      "ADR × Occupancy matrices, RevPAR scenarios and financing sensitivities for risk assessment.",
    icon: BarChart3
  },
  {
    id: "benchmarks",
    title: "Benchmark library",
    description:
      "Comprehensive leisure market data (Balearics first) with labor costs and operational benchmarks.",
    icon: Database,
    comingSoon: true
  },
  {
    id: "exports",
    title: "Export-ready outputs",
    description:
      "Board-level PDF reports and Excel exports for investor presentations and due diligence.",
    icon: FileSpreadsheet,
    comingSoon: true
  },
  {
    id: "roadmap",
    title: "Roadmap to opening",
    description:
      "From concept to pre-opening tasks with project management tools and compliance checklists.",
    icon: ClipboardList,
    comingSoon: true
  },
  {
    id: "consultancy",
    title: "Consultancy panel",
    description:
      "Get help validating assumptions, reviewing deals and pressure-testing your underwriting with experts.",
    icon: Users2,
    comingSoon: true
  },
  {
    id: "supplydb",
    title: "Hotel supply database",
    description:
      "Mapped competitive set and nearby hotels with key attributes to inform pricing and positioning.",
    icon: Map,
    comingSoon: true
  }
];