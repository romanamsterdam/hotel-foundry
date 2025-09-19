import React from "react";
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { getEnvConfig } from '../config/env';

function pillClass(tone: "default" | "info" | "success" | "warning" = "default") {
  switch (tone) {
    case "info": return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    case "success": return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "warning": return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    default: return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
  }
}

export default function Footer() {
  const { user } = useAuth();
  const { VITE_APP_ENV, VITE_DATA_SOURCE } = getEnvConfig();
  const year = new Date().getFullYear();

  const envTone =
    VITE_APP_ENV === "production" ? "success" :
    VITE_APP_ENV === "staging" ? "info" : "warning";

  return (
    <footer className="bg-white border-t border-gradient-to-r from-brand-200 via-accent-200 to-primary-200">
      <div className="h-px bg-gradient-to-r from-brand-400 via-accent-400 to-primary-400"></div>
      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              Membership
            </Link>
            <p className="text-slate-600 text-sm leading-relaxed mb-4 font-medium">
              Professional hotel underwriting platform for boutique property investments. 
              USALI-ready models, sensitivity analysis, and institutional-grade reporting.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-4">Platform</h3>
            <div className="space-y-2">
              <Link to="/properties" className="block text-sm text-slate-600 hover:text-brand-600 transition-colors font-medium">
                Properties
              </Link>
              <Link to="/membership" className="block text-sm text-slate-600 hover:text-brand-600 transition-colors font-medium">
                Pricing
              </Link>
              <Link to="/dashboard" className="block text-sm text-slate-600 hover:text-brand-600 transition-colors font-medium">
                Login
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-4">Legal</h3>
            <div className="space-y-2">
              <Link to="/legal/privacy" className="block text-sm text-slate-600 hover:text-brand-600 transition-colors font-medium">
                Privacy Policy
              </Link>
              <Link to="/legal/terms" className="block text-sm text-slate-600 hover:text-brand-600 transition-colors font-medium">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-8 pt-8">
          <div className="mx-auto max-w-7xl px-6 py-3 text-sm text-slate-600 flex items-center justify-between gap-3">
            <div className="truncate">© {year} Hotel Foundry</div>

            <div className="flex items-center gap-2">
              {import.meta.env.VITE_SHOW_DEBUG_PILL === "true" && <DebugPill />}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pillClass(envTone as any)}`}>
                {VITE_APP_ENV}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pillClass("info")}`}>
                {VITE_DATA_SOURCE}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pillClass("default")}`}>
                Role: {user?.role ?? "guest"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DebugPill() {
  const { user } = useAuth();
  const { VITE_AUTH_PROVIDER, VITE_DATA_SOURCE } = getEnvConfig();
  
  return (
    <div className="text-xs px-2 py-1 rounded bg-slate-200 font-mono">
      {VITE_AUTH_PROVIDER}/{VITE_DATA_SOURCE} · {user?.id?.slice(0,8) ?? "anon"}
    </div>
  );
}