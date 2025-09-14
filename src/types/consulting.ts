export type ConsultingRequestInput = {
  name?: string;
  email?: string;
  expertise: 'operations' | 'finance' | 'development' | 'other';
  seniority: 'junior' | 'standard' | 'partner';
  estimated_hours?: number | string | null;
  message?: string;
  user_id?: string | null;
  assignee?: string | null; // admin-only later
};