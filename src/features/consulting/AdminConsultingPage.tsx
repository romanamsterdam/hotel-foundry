import React from "react";
import ConsultingRequestsPage from "../../pages/admin/ConsultingRequestsPage";

/** Thin wrapper so routes that point to features/… keep working. */
export default function AdminConsultingPage() {
  return <ConsultingRequestsPage />;
}