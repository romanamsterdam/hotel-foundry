import * as React from "react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { submitConsultingRequest } from "../../features/consulting/api";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [hoursHint, setHoursHint] = useState<string>("");
  const [summary, setSummary] = useState("");
  const [seniority, setSeniority] = useState<Seniority>("standard");
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<null | string>(null);
  const [err, setErr] = useState<null | string>(null);

  const toggleExpertise = (key: string) =>
    setExpertise((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    setOk(null);
    try {
      // basic requireds (you already have required on inputs—this is belt & braces)
      if (!email || !summary) {
        setErr("Please provide your email and a short project summary.");
        setSubmitting(false);
        return;
      }

      // Insert to Supabase
      await submitConsultingRequest({
        name,
        email,
        company: undefined,         // add if you capture it
        summary,
        expertise,
        seniority,
        hourly: HOURLY[seniority],
        hoursHint,
      });

      setOk("Thanks! We'll review and send a proposal within 24 hours.");
      // Optional: clear form
      setName("");
      setEmail("");
      setExpertise([]);
      setHoursHint("");
      setSummary("");
      setSeniority("standard");
    } catch (e: any) {
      setErr(e?.message ?? "Submit failed. Please try again.");
      // still keep console for QA
      console.error("Consulting submit error:", e);
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
                  onClick={() => toggleExpertise(key)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    expertise.includes(key)
                      ? "border-black"
                      : "hover:border-slate-400"
                  )}
                  aria-pressed={expertise.includes(key)}
                >
                  <div className="font-medium">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick one or more. We'll assemble the right team.
            </p>
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
            <div className="flex flex-col items-end space-y-2">
              {err && <p className="text-sm text-rose-600">{err}</p>}
              {ok && <p className="text-sm text-emerald-700">{ok}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-xl bg-black px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Request a Proposal"}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}