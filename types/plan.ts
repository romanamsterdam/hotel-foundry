export interface Plan {
  id: 'beta' | 'starter' | 'pro';
  name: string;
  priceMonthly: number | null;
  lifetimePrice?: number | null;
  perks: string[];
  creditAllowance?: number;
  includesRoadmap?: boolean;
  badge?: string;
  description: string;
  features: {
    underwritingAccess: boolean;
    consultancyCredits: number;
    openingRoadmap: boolean;
    supportSLA: string;
    exports: boolean;
    benchmarks: boolean;
  };
}