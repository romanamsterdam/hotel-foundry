export type ConsultingArea = "operations" | "finance" | "development" | "other";
export type ConsultingStatus = 
  | "unread"
  | "proposal_submitted" 
  | "declined"
  | "in_progress"
  | "project_completed";

export interface ConsultingRequest {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  area: ConsultingArea[];
  message: string;
  hoursRequested?: number | null;
  hourlyRate: number; // 150
  createdAt: string;  // ISO
  status: ConsultingStatus;
  consultant?: string; // NEW: assigned consultant's name
}