import React from "react";
import MiniBars from "./MiniBars";

type RampCardProps = {
  title: string;
  subtitle: string;
  series: number[];                // four percentages
  active?: boolean;
  onSelect: () => void;
  color: "green" | "orange";
  scale?: { min: number; max: number };
};

export default function RampCard({
  title, subtitle, series, active, onSelect, color, scale
}: RampCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={[
        "w-full text-left rounded-xl border shadow-sm transition-all duration-200 h-full",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500",
        active
          ? "border-brand-500 ring-2 ring-brand-500/30 bg-brand-50"
          : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-md"
      ].join(" ")}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="mb-3">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-600 mt-1">{subtitle}</div>
        </div>
        <div className="mt-auto">
          <MiniBars values={series} color={color} scale={scale} />
        </div>
      </div>
    </button>
  );
}