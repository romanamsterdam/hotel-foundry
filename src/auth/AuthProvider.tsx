// Single source of truth: re-export Supabase provider + hook.
// If you ever add a mock provider again, switch the exports here.
export { AuthProvider, useAuth } from "./SupabaseAuthProvider";