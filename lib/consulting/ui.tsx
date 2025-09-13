import { Badge } from "../../components/ui/badge";
import type { ConsultingStatus } from "../../types/consulting";

export const statusLabel: Record<ConsultingStatus, string> = {
  unread: "Unread",
  proposal_submitted: "Proposal submitted",
  declined: "Declined",
  in_progress: "Work in progress",
  completed: "Project completed",
};

export function StatusBadge({ status }: { status: ConsultingStatus }) {
  // color mapping via variant classes from shadcn badge
  const variant =
    status === "unread" ? "secondary" :
    status === "proposal_submitted" ? "outline" :
    status === "declined" ? "destructive" :
    status === "in_progress" ? "default" :
    "secondary";

  // `success` variant doesn't exist by default; use className fallback
  const cls =
    status === "completed" ? "bg-emerald-600 text-white" : "";

  return <Badge variant={variant as any} className={cls}>{statusLabel[status]}</Badge>;
}