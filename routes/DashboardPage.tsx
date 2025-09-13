import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ChevronRight, LineChart, Users2, Database, ClipboardList, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

function SoonTag() {
  return (
    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      Coming soon
    </span>
  );
}

function BetaTag() {
  return (
    <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  cta,
  onClick,
  comingSoon,
  primary = false,
}: {
  title: string | React.ReactNode;
  description: string;
  icon: React.ComponentType<any>;
  cta: string;
  onClick?: () => void;
  comingSoon?: boolean;
  primary?: boolean;
}) {
  return (
    <Card className={`relative h-full rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${primary ? "ring-1 ring-brand-200" : ""} ${onClick ? "cursor-pointer" : ""}`}>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-3">
            <Icon className="h-6 w-6 text-slate-600" />
          </div>
          {comingSoon && <SoonTag />}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          {typeof title === 'string' ? (
            <>
              {title}
              {(title === 'Underwriting') && <BetaTag />}
            </>
          ) : (
            title
          )}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-6">
          <Button
            className={primary ? "bg-brand-600 hover:bg-brand-700 text-white" : ""}
            variant={primary ? "default" : "outline"}
            onClick={onClick}
            disabled={comingSoon}
          >
            {cta} <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToUnderwriting = () => {
    navigate("/underwriting");
  };

  const goToRoadmap = () => {
    navigate("/roadmap");
  };

  const goToConsultancy = () => {
    navigate("/consultancy");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, {user?.name || user?.email || 'Guest'}</h1>
        <p className="text-slate-600">Choose what you'd like to work on today.</p>
      </div>

      {/* Action grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          title="Underwriting"
          description="Build and analyze hotel deals with USALI P&L, debt service, IRR, and sensitivities."
          icon={LineChart}
          cta="Open Underwriting"
          onClick={goToUnderwriting}
          primary
        />
        <ActionCard
          title="Consultancy"
          description="Get expert help validating assumptions and reviewing your deal."
          icon={Users2}
          cta="View Consultancy"
          onClick={goToConsultancy}
        />
        <ActionCard
          title="Benchmarks"
          description="Market benchmarks for ADR, occupancy, payroll, and opex (Balearics first)."
          icon={Database}
          cta="Open benchmarks"
          comingSoon
        />
        <ActionCard
          title="Development Roadmap"
          description="From concept to opening with tasks, compliance and pre-opening checklists."
          icon={ClipboardList}
          cta="Open roadmap"
          onClick={goToRoadmap}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="text-xs text-slate-500 leading-relaxed max-w-4xl">
          <strong>Disclaimer:</strong> The information presented on this platform is provided for illustrative and informational purposes only. 
          It does not constitute financial advice, investment advice, or a recommendation of any kind. Calculations 
          and outputs are based on assumptions and simplified formulas which may not fully reflect actual performance 
          or market conditions. All hospitality and real estate investments involve significant risks and require 
          thorough independent due diligence. Users should not rely solely on this tool and are responsible for their 
          own decisions.
        </div>
      </div>
    </div>
  );
}