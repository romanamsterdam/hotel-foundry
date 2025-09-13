import React from "react";

type MiniBarsProps = {
  values: number[];              // e.g. [80,90,100,100]
  labels?: string[];             // default: ["Y1","Y2","Y3","Y4"]
  color?: "green" | "orange";
  scale?: { min: number; max: number }; // default for revenue 0..100, cost 100..120
};

export default function MiniBars({
  values,
  labels = ["Y1", "Y2", "Y3", "Y4"],
  color = "green",
  scale,
}: MiniBarsProps) {
  const min = scale?.min ?? (color === "orange" ? 100 : 0);
  const max = scale?.max ?? (color === "orange" ? 120 : 100);
  const norm = (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min)));

  return (
    <div className="flex items-end justify-center gap-2 h-16">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center">
          <div
            className={`w-3 rounded-sm ${color === "green" ? "bg-brand-400/70" : "bg-coral-400/70"}`}
            style={{ height: `${Math.max(8, Math.round(norm(v) * 100))}%` }}
            aria-label={`${labels[i]} ${v}%`}
            role="img"
          />
          <div className="mt-1 text-[10px] text-gray-500">{labels[i]}</div>
          <div className="text-[10px] text-gray-700">{v}%</div>
        </div>
      ))}
    </div>
  );
}