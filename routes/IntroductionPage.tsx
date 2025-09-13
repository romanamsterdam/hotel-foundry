import React from 'react';
import { ArrowRight, CheckCircle, TrendingUp, Calculator, Target, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface IntroductionPageProps {
  onGetStarted: () => void;
}

export default function IntroductionPage({ onGetStarted }: IntroductionPageProps) {
  const processSteps = [
    {
      icon: Target,
      title: "Deal Setup",
      description: "Define your property details and investment budget",
      details: "We'll help you organize the basic information about your hotel property and estimate the total investment required."
    },
    {
      icon: TrendingUp,
      title: "Revenue Modeling",
      description: "Project how much money your hotel will make",
      details: "Model room revenue, food & beverage income, and other revenue streams using industry benchmarks and seasonality patterns."
    },
    {
      icon: Calculator,
      title: "Cost Structure",
      description: "Estimate operating expenses and staffing costs",
      details: "Calculate ongoing costs like utilities, maintenance, marketing, and payroll using USALI hospitality accounting standards."
    },
    {
      icon: CheckCircle,
      title: "Financial Analysis",
      description: "See if the investment makes financial sense",
      details: "Review profit projections, cash flow, and return calculations to determine if this hotel investment meets your goals."
    }
  ];

  const keyQuestions = [
    "How much money do I need to invest upfront?",
    "What revenue can I realistically expect?",
    "What are the ongoing operating costs?",
    "What return will I get on my investment?",
    "When will I break even and start making profit?",
    "How does this compare to other investment options?"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Welcome to Hotel Investment Analysis
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Let's walk through analyzing your hotel investment step by step. 
          We'll help you understand the numbers and make an informed decision.
        </p>
      </div>

      {/* What We'll Figure Out */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Target className="h-6 w-6 text-brand-600" />
            <span>What We'll Figure Out Together</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {keyQuestions.map((question, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-semibold text-sm">
                  {index + 1}
                </div>
                <p className="text-slate-700 font-medium">{question}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* The Process */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Our Step-by-Step Process</CardTitle>
          <p className="text-slate-600">
            We've broken down hotel investment analysis into 4 manageable stages. 
            Each step builds on the previous one, so you'll understand how everything connects.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        Step {index + 1}
                      </Badge>
                    </div>
                    <p className="text-slate-700 font-medium mb-2">{step.description}</p>
                    <p className="text-sm text-slate-600">{step.details}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* What Makes This Different */}
      <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-brand-50">
        <CardHeader>
          <CardTitle className="text-xl">What Makes Hotel Foundry Different</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Industry Standards</h3>
              <p className="text-sm text-slate-600">
                We use USALI accounting standards and real market benchmarks, 
                so your analysis meets professional investor expectations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Beginner Friendly</h3>
              <p className="text-sm text-slate-600">
                No finance background required. We explain everything in plain English 
                and guide you through each decision.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Comprehensive</h3>
              <p className="text-sm text-slate-600">
                From initial investment to 10-year projections, 
                we cover everything you need for a complete analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <CardTitle className="text-lg text-amber-900">Important Disclaimer</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-amber-800">
            <p className="font-medium">
              This analysis is for educational and planning purposes only.
            </p>
            <ul className="space-y-2 text-sm">
              <li>• All projections are estimates based on assumptions and may not reflect actual performance</li>
              <li>• Hotel investments involve significant risks including market changes, competition, and operational challenges</li>
              <li>• You should conduct thorough due diligence and consult with qualified professionals before making any investment decisions</li>
              <li>• Past performance and benchmarks do not guarantee future results</li>
              <li>• Consider this a starting point for your analysis, not a final investment recommendation</li>
            </ul>
            <p className="text-sm font-medium mt-4">
              Always seek advice from qualified financial advisors, accountants, and hospitality professionals 
              before proceeding with any hotel investment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Get Started */}
      <div className="text-center">
        <Button
          onClick={onGetStarted}
          size="lg"
          className="bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold px-8"
        >
          <span>Start Your Analysis</span>
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-sm text-slate-500 mt-3">
          Takes about 15-30 minutes to complete • Save and return anytime
        </p>
      </div>
    </div>
  );
}