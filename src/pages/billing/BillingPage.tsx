import React from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../auth/AuthProvider";
import { useToast } from "../../components/ui/toast";
import { formatCurrency } from "../../lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Basic access to explore the platform",
    features: [
      "View property gallery",
      "Basic underwriting tools",
      "Community support"
    ]
  },
  {
    id: "starter", 
    name: "Starter",
    price: 15,
    description: "Essential tools for hotel underwriting",
    features: [
      "Complete underwriting platform",
      "USALI-ready P&L templates", 
      "IRR & DSCR calculations",
      "Sensitivity grids",
      "PDF exports",
      "Priority email support"
    ],
    popular: true
  },
  {
    id: "pro",
    name: "Pro", 
    price: 49,
    description: "Complete solution with expert support",
    features: [
      "Everything in Starter",
      "10 consultancy credits per month",
      "Hotel opening roadmap access",
      "Advanced benchmarks library",
      "Custom sensitivity scenarios",
      "Excel & PDF exports",
      "Phone & video support"
    ]
  }
];

export default function BillingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = (planId: string) => {
    if (!user) {
      navigate("/signin");
      return;
    }

    // Mock subscription - update user tier
    const tierMap: Record<string, "Free" | "Starter" | "Pro"> = {
      free: "Free",
      starter: "Starter", 
      pro: "Pro"
    };

    const newTier = tierMap[planId] || "Free";
    
    // Update user with new tier
    const updatedUser = { ...user, tier: newTier };
    setUser(updatedUser);
    
    // Persist tier
    localStorage.setItem("hf_user_tier", newTier);
    
    toast.success(`Subscribed to ${plans.find(p => p.id === planId)?.name} plan!`);
    navigate("/billing/success");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-6xl py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Select the plan that best fits your hotel investment needs.
          </p>
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4 max-w-2xl mx-auto">
            <p className="text-amber-800 text-sm font-medium">
              🚧 Mock billing for development. Stripe integration coming soon.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative transform hover:scale-105 transition-all duration-300 ${
              plan.popular ? 'ring-2 ring-brand-500 shadow-xl scale-105' : 'hover:shadow-xl'
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand-500 text-white font-bold">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="py-4">
                  <span className="text-4xl font-black">
                    {plan.price === 0 ? "Free" : formatCurrency(plan.price, "EUR")}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-600 font-medium"> /month</span>
                  )}
                </div>
                <p className="text-slate-600 font-medium">{plan.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full ${
                    plan.popular 
                      ? "bg-brand-600 hover:bg-brand-700 text-white" 
                      : "bg-slate-600 hover:bg-slate-700 text-white"
                  }`}
                  disabled={user?.tier === (plan.id === "free" ? "Free" : plan.id === "starter" ? "Starter" : "Pro")}
                >
                  {user?.tier === (plan.id === "free" ? "Free" : plan.id === "starter" ? "Starter" : "Pro") 
                    ? "Current Plan" 
                    : plan.price === 0 
                    ? "Get Started" 
                    : "Subscribe"
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">
            Need a custom enterprise solution?
          </p>
          <Button variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}