import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useDisplayName } from "../hooks/useDisplayName";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ChevronRight, LineChart, Users2, Database, ClipboardList } from "lucide-react";

const FEATURE_ADMIN = import.meta.env.VITE_FEATURE_ADMIN !== "false";

function SoonTag() {
  return (
    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      Coming soon
    </span>
  );
}

function BetaTag() {
  return <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>;
}

type ActionCardProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
  onClick?: () => void;
  comingSoon?: boolean;
  primary?: boolean;
};

function ActionCard({
  title,
  description,
  icon: Icon,
  cta,
  onClick,
  comingSoon,
  primary = false,
}: ActionCardProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={[
        "group relative w-full text-left",
        onClick ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
    >
      <Card
        className={[
          "transition-all duration-200 h-full",
          primary
            ? "border-emerald-200 bg-gradient-to-b from-emerald-50 to-white"
            : "hover:shadow-md",
        ].join(" ")}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border p-2">
              <Icon className="h-5 w-5 text-slate-700" />
            </div>
            <div className="flex-1">
              <div className="mb-1 font-semibold text-slate-900">
                {title}
                {title === "Underwriting" && <BetaTag />}
                {comingSoon && <SoonTag />}
              </div>
              <p className="text-sm text-slate-600">{description}</p>
              <div className="mt-4">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                  {cta}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const name = useDisplayName();
  const isAdmin = !!user && user.role === "admin";
  const navigate = useNavigate();

  const goToUnderwriting = () => navigate("/underwriting");
  const goToConsultancy = () => navigate("/consultancy");
  const goToRoadmap = () => navigate("/roadmap");

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {`Welcome back${name ? `, ${name}` : ""}.`}
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Ready to move your hotel idea forward?
          </p>
        </div>
      </div>

      {/* Admin Console Link (kept from new version) */}
      {FEATURE_ADMIN && isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex flex-row items-center justify-between">
              <span>Admin Console</span>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin">Open Admin</Link>
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Legacy product grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Disclaimer (unchanged text, compact) */}
      <div className="mt-12 border-t border-slate-200 pt-8">
        <div className="max-w-4xl text-xs leading-relaxed text-slate-500">
          <strong>Disclaimer:</strong> The information presented on this platform is provided for
          illustrative and informational purposes only. It does not constitute financial advice,
          investment advice, or a recommendation of any kind. Calculations and outputs are based on
          assumptions and simplified formulas which may not fully reflect actual performance or market
          conditions. All hospitality and real estate investments involve significant risks and require
          thorough independent due diligence. Users should not rely solely on this tool and are
          responsible for their own decisions.
        </div>
      </div>
    </div>
  );
}