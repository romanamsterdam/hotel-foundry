import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Info, Scale, BarChart3, Users2 } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Tooltip as UITooltip, TooltipContent as UITooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { eur } from "../lib/format";

type Point = { yearLabel: string; cash: number; cum: number };

type TooltipPayload = {
  dataKey: string;
  value: number;
  name?: string;
  color?: string;
};

type TooltipContentProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
};

const model = {
  equityInvested: 5_000_000,
  // y0 investment (negative), then yearly distributions
  annual: [-8_500_000, 400_000, 600_000, 800_000, 1_000_000, 1_200_000, 1_400_000, 1_600_000, 1_800_000, 12_000_000],
  kpis: { adr: 140, occ: 0.72, irr: 0.189, multiple: 2.38, paybackYear: 6, rooms: 28, projectCost: 8_500_000 }
};

function useSeries(): Point[] {
  return useMemo(() => {
    let cum = 0;
    return model.annual.map((v, i) => {
      cum += v;
      return { yearLabel: i === 0 ? "Initial" : `Year ${i}`, cash: v, cum };
    });
  }, []);
}

function TooltipContent({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const cash = payload.find(p => p.dataKey === "cash")?.value ?? 0;
  const cum = payload.find(p => p.dataKey === "cum")?.value ?? 0;
  return (
    <div className="rounded-lg border bg-white p-3 text-sm shadow-card">
      <div className="font-semibold text-ink-700">{label}</div>
      <div className="mt-1">Annual cash: <span className="font-medium">{eur(cash)}</span></div>
      <div>Cumulative: <span className="font-medium">{eur(cum)}</span></div>
    </div>
  );
}

function KpiStat({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-3 cursor-help">
            <div className="text-slate-500 flex items-center gap-1">
              {label}
              <Info className="h-3 w-3 text-slate-400" />
            </div>
            <div className="font-semibold text-ink-700">{value}</div>
          </div>
        </TooltipTrigger>
        <UITooltipContent side="top" className="max-w-xs text-sm text-slate-600 bg-white border border-slate-200 shadow-lg">
          {description}
        </UITooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

export default function HeroInvestmentPanel() {
  const data = useSeries();
  const { adr, occ, irr, multiple, paybackYear } = model.kpis;

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 bg-fintech-hero text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-transparent to-accent-500/15"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400/8 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-400/8 rounded-full blur-3xl"></div>
      
      {/* Hero fade transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-hero-fade pointer-events-none"></div>
      
      <div className="grid items-start gap-10 lg:grid-cols-2">
        {/* Left copy */}
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight"
          >
            Smart hotel underwriting. No spreadsheets.
          </motion.h1>
          <p className="mt-6 max-w-xl text-xl text-white/90 leading-relaxed font-medium">
            Making professional-grade analysis for boutique hotels accessible and user friendly.
          </p>
          <p className="mt-4 max-w-xl text-lg text-white/80 leading-relaxed font-medium">
            Helping you take your hotel idea to a successfully operating business. Your hotelier journey starts here.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/membership">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold px-8">
                Run your first deal now
              </Button>
            </Link>
            <Link to="/properties">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white/90 hover:bg-white/10 hover:text-white hover:border-white/50 hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium px-8"
              >
                Explore property gallery
              </Button>
            </Link>
          </div>

          {/* Credibility Signals */}
          <div className="mt-10 flex flex-wrap gap-6 justify-center lg:justify-start">
            <div className="flex items-center space-x-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/20">
              <Scale className="h-4 w-4 text-white/80" />
              <span className="text-sm font-medium text-white/90">Based on USALI</span>
            </div>
            <div className="flex items-center space-x-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/20">
              <BarChart3 className="h-4 w-4 text-white/80" />
              <span className="text-sm font-medium text-white/90">Benchmarked against 50+ hotels</span>
            </div>
            <div className="flex items-center space-x-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/20">
              <Users2 className="h-4 w-4 text-white/80" />
              <span className="text-sm font-medium text-white/90">Your journey supported by our expert consultants</span>
            </div>
          </div>

          {/* Feature bullets */}
          <ul className="mt-8 space-y-3 text-base text-white/80 font-medium">
            <li>• USALI cost structure</li>
            <li>• Industry benchmarks </li>
            <li>• Expert consultancy panel (Pro)</li>
          </ul>
        </div>


        {/* Right panel */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="relative z-10">
          <Card className="rounded-3xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/30">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Investment Payback Analysis</h3>
                  <p className="text-sm text-slate-600 font-medium">€{(model.kpis.projectCost/1_000_000).toFixed(1)}M total investment • 10-year projection with exit</p>
                </div>
                <span className="rounded-full bg-gradient-to-r from-brand-100 to-accent-100 px-3 py-1 text-xs font-bold text-brand-700 border border-brand-200">Interactive</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                    <defs>
                      <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="yearLabel" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v)=> `€${(v/1_000_000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                    <ReferenceLine y={0} stroke="#94a3b8" />
                    <Tooltip content={<TooltipContent />} />
                    <Bar name="Annual cash" dataKey="cash" barSize={18} fill="#22c55e" />
                    <Area name="Cumulative" dataKey="cum" fill="url(#cumFill)" stroke="#14b8a6" strokeWidth={3} />
                    <Line name="Cumulative (line)" dataKey="cum" dot={false} stroke="#14b8a6" strokeWidth={3}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <KpiStat 
                  label="Rooms" 
                  value={`${model.kpis.rooms}`} 
                  description="Total number of hotel rooms available for guests."
                />
                <KpiStat 
                  label="Investment cost" 
                  value={eur(model.kpis.projectCost)} 
                  description="Total project cost including acquisition and development."
                />
                <KpiStat 
                  label="IRR" 
                  value={`${Math.round(model.kpis.irr*100)}%`} 
                  description="Internal Rate of Return: annualized return percentage."
                />
                <KpiStat 
                  label="Equity multiple" 
                  value={`${model.kpis.multiple.toFixed(1)}x`} 
                  description="Multiple of initial equity returned over project life."
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}