export type Role = 'user' | 'admin';
export type Subscription = 'free' | 'starter' | 'pro' | 'beta';

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role?: Role;               // from profiles.role
  subscription?: Subscription; // from profiles.subscription
};