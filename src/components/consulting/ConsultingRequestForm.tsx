import * as React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../auth/AuthProvider";
import { useToast } from "../ui/toast";
import { getDataSource } from "../../lib/datasource";
import type { ConsultingRequestInput, ConsultingExpertise } from "../../lib/datasource/types";

// If you use shadcn/ui, uncomment these and remove the minimal elements below
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Checkbox } from "@/components/ui/checkbox";

type Seniority = "junior" | "standard" | "partner";

const HOURLY: Record<Seniority, number> = {
  junior: 80,
  standard: 150,
  partner: 300,
};

export default function ConsultingRequestForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expertise, setExpertise] = useState<ConsultingExpertise>("operations");
  const [hoursHint, setHoursHint] = useState<string>("");
  const [summary, setSummary] = useState("");
  const [seniority, setSeniority] = useState<Seniority>("standard");
  const [submitting, setSubmitting] = useState(false);

  // Prefill from auth when user signs in
  useEffect(() => {
    if (user) {
      setName(v => v || user.name || "");
      setEmail(v => v || user.email || "");
    }
  }, [user?.id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Basic validation
      if (!email.trim() || !summary.trim()) {
        toast.error("Please provide your email and a short project summary.");
        setSubmitting(false);
        return;
      }

      const ds = getDataSource();
      if (typeof ds.createConsultingRequest !== "function") {
        throw new Error("DataSource misconfigured: createConsultingRequest not a function");
      }

      const payload: ConsultingRequestInput = {
        name,
        email,
        expertise, // Single string now
        seniority,
        estimatedHours: hoursHint ? Number(hoursHint) || null : null,
        message: summary,
      };

      const { data, error } = await ds.createConsultingRequest(payload);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Request sent. We'll reply within 24h.");
      // Clear form
      setSummary("");
      setHoursHint("");
      setExpertise("operations");
      if (!user) {
        setName("");
        setEmail("");
      }
    } catch (err: any) {
      console.error("[Consulting submit] failed:", err);
      toast.error(err?.message || "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Hotel Consulting Request</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us where you need help. We'll match the right specialist and
            send a fixed quote within 24 hours.
          </p>

          <div className="mt-4 rounded-xl border bg-slate-50 p-4">
            <ul className="grid gap-2 text-sm">
              <li>• Most questions are solved with a short review (1–2 hours).</li>
              <li>
                • Larger projects can be quoted at volume rates (from €80/hr).
              </li>
              <li>
                • Choose seniority below —{" "}
                <strong>Junior (€80)</strong>, <strong>Standard (€150)</strong>,
                or <strong>Partner (€300)</strong> per hour.
              </li>
            </ul>
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Name / Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Email <span className="text-rose-600">*</span>
              </label>
              <input
                required
                type="email"
                className="w-full rounded-lg border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              {user && email === user.email && (
                <p className="mt-1 text-xs text-slate-500">Using your account email</p>
              )}
            </div>
          </div>

          {/* Expertise */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Expertise Needed <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["operations", "Operations", "Staffing, standards, guest experience"],
                ["finance", "Finance", "P&L review, pricing, optimization"],
                ["development", "Development", "Project mgmt, permits, construction"],
                ["other", "Other", "Marketing, branding, tech, legal"],
              ].map(([key, title, desc]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExpertise(key as ConsultingExpertise)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    expertise === key
                      ? "border-black"
                      : "hover:border-slate-400"
                  )}
                  aria-pressed={expertise === key}
                >
                  <div className="font-medium">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Seniority selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Preferred Seniority & Rate
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                ["junior", "Junior", "€80/hr · great for scoped tasks"],
                ["standard", "Standard", "€150/hr · best for most requests"],
                ["partner", "Partner", "€300/hr · industry leader review"],
              ] as const).map(([key, label, note]) => (
                <label
                  key={key}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3",
                    seniority === key ? "border-black" : "hover:border-slate-400"
                  )}
                >
                  <input
                    type="radio"
                    name="seniority"
                    value={key}
                    checked={seniority === key}
                    onChange={() => setSeniority(key)}
                    className="mr-2"
                  />
                  <span className="font-medium">{label}</span>
                  <div className="text-xs text-muted-foreground">{note}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Hours hint */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Estimated Hours (optional)
              </label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-lg border px-3 py-2"
                placeholder="e.g., 2"
                value={hoursHint}
                onChange={(e) => setHoursHint(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                We'll confirm scope in our proposal.
              </p>
            </div>

            {/* Project summary */}
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm font-medium">
                What do you need help with? <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                className="h-32 w-full rounded-lg border px-3 py-2"
                placeholder="Describe your property, timeline, budget, specific questions, and desired outcome..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The clearer the brief, the faster we can help.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Response time:</span> within 24 hours.
            </p>
            <button
              type="submit"
              disabled={submitting || !email.trim() || !summary.trim()}
              className="inline-flex items-center rounded-xl bg-black px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Request a Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}