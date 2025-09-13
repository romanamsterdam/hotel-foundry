import { ConsultingRequest } from "../types/consulting";

export const SEED_CONSULTING: ConsultingRequest[] = [
  {
    id: "REQ-24001",
    title: "Underwrite 24-key surf hotel",
    company: "Siargao Surf Holdings",
    contactName: "Maya Santos",
    email: "maya@example.com",
    country: "PH",
    budget: 3500,
    currency: "EUR",
    createdAt: new Date(Date.now() - 2 * 864e5).toISOString(),
    status: "unread",
    assignee: "",
    unread: true,
    tags: ["underwriting", "APAC"],
    notes: "Wants 10-day turnaround with sensitivity.",
    message:
      "We have LOI on land in Siargao. Need underwriting and a light IM for investors. Please include 3 ramp scenarios and payroll sanity check."
  },
  {
    id: "REQ-24002",
    title: "Asset review for 42-room city hotel",
    company: "Blue Key Capital",
    contactName: "Jonas Weber",
    email: "jonas@example.com",
    country: "ES",
    budget: 6000,
    currency: "EUR",
    createdAt: new Date(Date.now() - 8 * 864e5).toISOString(),
    status: "proposal_submitted",
    assignee: "Anna P.",
    unread: false,
    tags: ["asset mgmt"],
    message:
      "Please review our asset plan. Focus on ADR uplift and light capex. We need a quick proposal."
  },
  {
    id: "REQ-24003",
    title: "Payroll benchmarking request",
    company: "Lagoon Resorts",
    contactName: "Chi Nguyen",
    email: "chi@example.com",
    country: "VN",
    budget: 1200,
    currency: "EUR",
    createdAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    status: "in_progress",
    assignee: "Roman",
    unread: false,
    tags: ["benchmarks"],
    message:
      "Looking for payroll benchmarks by department for VN beach resorts. Include typical FTE per key and salary bands."
  }
];