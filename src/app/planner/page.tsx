"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { computeCapacity, CAPACITY_PRESETS } from "@/lib/data";
import { Reveal } from "@/components/ui";

type PresetKey = "Single PHC" | "District pilot" | "State scale";

function parsePreset(p: PresetKey) {
  return CAPACITY_PRESETS[p];
}

export default function Planner() {
  const [cams, setCams] = useState(3);
  const [reviewers, setReviewers] = useState(2);
  const [arrivals, setArrivals] = useState(25);
  const [activePreset, setActivePreset] = useState<PresetKey | null>("District pilot");

  const applyPreset = (p: PresetKey) => {
    const v = parsePreset(p);
    setCams(v.cams);
    setReviewers(v.reviewers);
    setArrivals(v.arrivals);
    setActivePreset(p);
  };

  const cap = useMemo(
    () => computeCapacity(cams, reviewers, arrivals),
    [cams, reviewers, arrivals]
  );

  // district scaling chart to 100k+/year
  const scaling = useMemo(() => {
    const base = cap.patientsPerDay * 300;
    return [
      { label: "1 PHC", patients: base },
      { label: "5 PHCs", patients: base * 5 },
      { label: "10 PHCs", patients: base * 10 },
      { label: "20 PHCs", patients: base * 20 },
      { label: "District", patients: base * 40 },
    ];
  }, [cap.patientsPerDay]);

  return (
    <div className="pt-24 px-5 max-w-7xl mx-auto pb-24">
      <Reveal className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-2">
          Program planning
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Capacity <span className="text-gradient">Planner</span>
        </h1>
        <p className="mt-3 text-foreground/60 max-w-2xl mx-auto">
          Tune the cameras, reviewers and patient arrival rate to estimate
          throughput, wait times and utilization — and scale it to a whole
          district.
        </p>
      </Reveal>

      {/* Presets */}
      <Reveal>
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {(Object.keys(CAPACITY_PRESETS) as PresetKey[]).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                activePreset === p
                  ? "bg-primary text-surface font-medium"
                  : "border border-white/10 text-foreground/70 hover:border-primary/40"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Controls */}
        <Reveal>
          <div className="glass p-6">
            <h2 className="font-bold text-white mb-6">Parameters</h2>

            <Slider label="Cameras" value={cams} min={1} max={10} onChange={setCams} suffix=" cameras" />
            <Slider label="Reviewers" value={reviewers} min={1} max={6} onChange={setReviewers} suffix=" reviewers" />
            <Slider label="Arrivals / hour" value={arrivals} min={10} max={60} onChange={setArrivals} suffix="/hr" />

            {/* queue viz */}
            <div className="mt-8">
              <p className="text-xs uppercase tracking-wider text-foreground/50 mb-3">
                Queue at peak
              </p>
              <div className="flex items-end gap-1 h-32">
                {Array.from({ length: Math.max(1, Math.min(24, cap.queueLength + 2)) }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t"
                    animate={{ height: `${innerCompute(i, cap.queueLength)}%` }}
                    style={{
                      background:
                        i < 2
                          ? "#34D399"
                          : i < cap.queueLength * 0.5
                          ? "#FBBF24"
                          : "#22D3EE",
                      opacity: 0.8,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-foreground/50">
                {cap.queueLength} patients queued · mean wait {cap.meanWait} min
              </p>
            </div>
          </div>
        </Reveal>

        {/* Outputs */}
        <Reveal delay={0.1}>
          <div className="glass p-6">
            <h2 className="font-bold text-white mb-6">Outputs</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <OutputCard label="Patients / day" value={cap.patientsPerDay} color="#22D3EE" />
              <OutputCard label="Patients / year" value={cap.patientsPerYear.toLocaleString()} color="#34D399" />
              <OutputCard label="Mean wait time" value={`${cap.meanWait} min`} color="#FBBF24" />
              <OutputCard label="Utilization" value={`${cap.utilization}%`} color="#F87171" />
            </div>

            <p className="text-xs uppercase tracking-wider text-foreground/50 mb-3">
              District scaling (per year)
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scaling} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid stroke="#ffffff12" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={{ stroke: "#ffffff22" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={{ stroke: "#ffffff22" }} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#22d3ee11" }}
                    contentStyle={{ background: "#0a1628", border: "1px solid #22d3ee44", borderRadius: 8 }}
                    formatter={(v) => [(v as number).toLocaleString(), "patients/year"]}
                  />
                  <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                    {scaling.map((_, i) => (
                      <Cell key={i} fill={i === scaling.length - 1 ? "#22d3ee" : "#22d3ee66"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {scaling[scaling.length - 1].patients >= 100000 && (
              <p className="mt-2 text-[11px] text-success">
                ✓ Scaling to {scaling[scaling.length - 1].patients.toLocaleString()} patients/year across the district.
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-foreground/70">{label}</span>
        <span className="tabular text-primary font-medium">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-primary"
        aria-label={label}
      />
    </div>
  );
}

function OutputCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-4">
      <div className="tabular text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <p className="text-xs text-foreground/50 mt-1">{label}</p>
    </div>
  );
}

function innerCompute(i: number, q: number): number {
  const base = 18 + ((i * 37) % 60);
  const peak = q > 0 ? Math.min(100, 30 + q * 4) : 25;
  return Math.max(15, Math.min(100, Math.abs(base - i * 2) * 0.8 + peak * (i === 0 ? 0.5 : 0.3)));
}
