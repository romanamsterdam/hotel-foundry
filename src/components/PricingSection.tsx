import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plan } from '../types/plan';
import { formatCurrency } from '../lib/utils';
import SignUpModal from './auth/SignUpModal';

interface PricingSectionProps {
  plans: Plan[];
  showComparison?: boolean;
}

export default function PricingSection({ plans, showComparison = false }: PricingSectionProps) {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetStarted = (plan: Plan) => {
    setIsSubmitting(true);
    setSelectedPlan(plan);
    setShowSignUpModal(true);
    // Reset submitting state when modal opens
    setTimeout(() => setIsSubmitting(false), 100);
  };

  return (
    <div className="space-y-12">
      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 ${
            plan.id === 'beta' ? 'bg-gradient-to-br from-coral-50 to-coral-100 border-coral-300 ring-2 ring-coral-400/50 shadow-2xl scale-105' : 
            plan.id === 'pro' ? 'bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-300 ring-2 ring-purple-400/50 shadow-2xl scale-105' : 
            'bg-gradient-to-br from-white to-brand-50 border-brand-200 hover:shadow-2xl hover:border-brand-300'
          } transition-all duration-300`}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default" className={`${
                  plan.id === 'beta' ? 'bg-gradient-to-r from-coral-500 to-coral-600 text-white' :
                  plan.id === 'pro' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' :
                  'bg-gradient-to-r from-brand-500 to-brand-600 text-white'
                } font-bold shadow-lg`}>
                  {plan.badge}
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              {plan.id === 'beta' && (
                <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-coral-100 to-coral-200 px-3 py-1 text-xs font-semibold text-coral-700">
                  🔥 Limited Time
                </span>
              )}
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <div className="py-4">
                {plan.lifetimePrice ? (
                  <div>
                    <span className="text-4xl font-black">{formatCurrency(plan.lifetimePrice)}</span>
                    <span className="text-slate-600 font-medium"> lifetime</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-black">{formatCurrency(plan.priceMonthly!)}</span>
                    <span className="text-slate-600 font-medium"> /month</span>
                  </div>
                )}
              </div>
              <CardDescription className="font-medium">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.perks.map((perk, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 font-medium">{perk}</span>
                  </li>
                ))}
              </ul>
              {plan.id === 'beta' ? (
                <Button 
                  className="w-full bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-400 hover:to-coral-500 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold"
                  onClick={() => handleGetStarted(plan)}
                  disabled={isSubmitting}
                  size="lg"
                >
                  Get Beta
                </Button>
              ) : (
                <Button 
                  className="w-full bg-slate-300 text-slate-500 cursor-not-allowed"
                  disabled
                  size="lg"
                >
                  Coming Soon
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 border border-slate-200 shadow-lg">
          <h3 className="text-3xl font-black text-center mb-8 text-slate-900">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-4 px-4 font-bold text-slate-900">Features</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 font-bold text-slate-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700 font-medium">Underwriting Access</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4">
                      {plan.features.underwritingAccess ? (
                        <Check className="h-5 w-5 text-primary-600 mx-auto" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700 font-medium">Consultancy Credits/Month</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-slate-700 font-medium">
                      {plan.features.consultancyCredits || '-'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700 font-medium">Opening Roadmap</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4">
                      {plan.features.openingRoadmap ? (
                        <Check className="h-5 w-5 text-primary-600 mx-auto" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700 font-medium">Support SLA</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-slate-700 font-medium">
                      {plan.features.supportSLA}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700 font-medium">Exports</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4">
                      {plan.features.exports ? (
                        <Check className="h-5 w-5 text-primary-600 mx-auto" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-slate-700 font-medium">Benchmarks</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4">
                      {plan.features.benchmarks ? (
                        <Check className="h-5 w-5 text-primary-600 mx-auto" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        planId={selectedPlan?.id || ''}
        planName={selectedPlan?.name || ''}
      />
    </div>
  );
}
