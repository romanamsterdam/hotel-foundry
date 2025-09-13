import { Plan } from '../types/plan';

export const plans: Plan[] = [
  {
    id: 'beta',
    name: 'Beta-tester',
    priceMonthly: null,
    lifetimePrice: 99,
    badge: 'Limited Offer',
    description: 'Perfect for testing our underwriting platform',
    perks: [
      'Full underwriting platform access',
      'USALI P&L modeling',
      'Basic sensitivity analysis',
      'Email support'
    ],
    features: {
      underwritingAccess: true,
      consultancyCredits: 0,
      openingRoadmap: false,
      supportSLA: 'Email support',
      exports: true,
      benchmarks: false
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 99,
    lifetimePrice: null,
    description: 'Essential tools for boutique hotel underwriting',
    perks: [
      'Complete underwriting platform',
      'USALI-ready P&L templates',
      'IRR & DSCR calculations',
      'Sensitivity grids',
      'Basic benchmark data',
      'PDF exports',
      'Priority email support'
    ],
    creditAllowance: 0,
    features: {
      underwritingAccess: true,
      consultancyCredits: 0,
      openingRoadmap: false,
      supportSLA: 'Priority email',
      exports: true,
      benchmarks: true
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 299,
    lifetimePrice: null,
    description: 'Complete solution with expert consultancy support',
    perks: [
      'Everything in Starter',
      '10 consultancy credits per month',
      'Hotel opening roadmap access',
      'Advanced benchmarks library',
      'Custom sensitivity scenarios',
      'Excel & PDF exports',
      'Phone & video support',
      'Due diligence templates'
    ],
    creditAllowance: 10,
    includesRoadmap: true,
    features: {
      underwritingAccess: true,
      consultancyCredits: 10,
      openingRoadmap: true,
      supportSLA: 'Phone & video',
      exports: true,
      benchmarks: true
    }
  }
];