"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fetchPatients } from "@/lib/api";
import type { PatientRecord } from "@/lib/types";
import { TrustDial } from "@/components/TrustDial";
import { Reveal } from "@/components/ui";

type Filter = "all" | "cleared" | "review" | "urgent";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cleared", label: "Auto-cleared (HIGH)" },
  { key: "review", label: "Needs review (MODERATE)" },
  { key: "urgent", label: "Urgent (LOW + DME)" },
];

const STATUS_COLOR: Record<string, string> = {
  "AUTO-CLEARED": "#34D399",
  "NEEDS REVIEW": "#FBBF24",
  URGENT: "#F87171",
  REJECTED: "#888",
};

export default function Dashboard() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<PatientRecord | null>(null);

  useEffect(() => {
    fetchPatients().then(setPatients);
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case "cleared":
        return patients.filter((p) => p.trust_level === "HIGH");
      case "review":
        return patients.filter((p) => p.trust_level === "MODERATE");
      case "urgent":
        return patients.filter((p) => p.trust_level === "LOW" || p.dme);
      default:
        return patients;
    }
  }, [patients, filter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const screenedToday = patients.filter((p) => p.date >= today).length;
    const referable = patients.filter((p) => p.status === "URGENT" || p.dme).length;
    const queue = patients.filter((p) => p.status === "NEEDS REVIEW").length;
    return { screenedToday, referable, queue, avgTime: "4.1s" };
  }, [patients]);

  return (
    <div className="pt-24 px-5 max-w-7xl mx-auto pb-24">
      <Reveal className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-2">
          Doctor review queue
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Screening <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="mt-2 text-foreground/50 text-sm">
          Demo data demonstrating the human-in-the-loop workflow. MODERATE cases
          wait for a doctor&apos;s sign-off.
        </p>
      </Reveal>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Screened today" value={stats.screenedToday} suffix="" color="#22D3EE" />
        <StatCard label="Referable caught" value={stats.referable} suffix="" color="#F87171" />
        <StatCard label="Review queue" value={stats.queue} suffix="" color="#FBBF24" />
        <StatCard label="Avg processing" value={stats.avgTime} suffix="" color="#34D399" />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              filter === f.key
                ? "bg-primary text-surface font-medium"
                : "border border-white/10 text-foreground/70 hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-foreground/40 border-b border-white/10">
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Conf.</th>
                <th className="px-4 py-3 font-medium">Trust</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{p.id}</td>
                  <td className="px-4 py-3 text-foreground/60 tabular">{p.date}</td>
                  <td className="px-4 py-3 text-foreground/80">{p.grade}</td>
                  <td className="px-4 py-3 tabular">
                    {(p.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                      style={{
                        color: STATUS_COLOR[p.status] || "#888",
                        background: `${STATUS_COLOR[p.status] || "#888"}1a`,
                      }}
                    >
                      {p.trust_level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: STATUS_COLOR[p.status] || "#888" }}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-foreground/40">
                    No cases in this queue. This is a good sign.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="glass-strong max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CaseDetail record={selected} onClose={() => setSelected(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, suffix, color }: { label: string; value: string | number; suffix: string; color: string }) {
  return (
    <div className="glass p-4">
      <div className="tabular text-3xl font-bold" style={{ color }}>
        {value}
        {suffix}
      </div>
      <p className="text-xs text-foreground/50 mt-1">{label}</p>
    </div>
  );
}

function CaseDetail({ record, onClose }: { record: PatientRecord; onClose: () => void }) {
  const r = record.result;
  const trust = r.trust;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-lg">{record.id}</h3>
        <button onClick={onClose} className="text-foreground/60 hover:text-white text-xl" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Retina + overlays */}
        <div>
          <div className="relative rounded-xl overflow-hidden border border-white/10 h-48 grid place-items-center bg-surface2/60">
            <div className="text-5xl opacity-40">⚪</div>
            <span className="absolute top-2 left-2 text-[10px] bg-black/50 px-2 py-0.5 rounded">
              Retina (demo)
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white font-medium tabular">{r.evidence.ma_count}</p>
              <p className="text-foreground/50">MAs</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white font-medium tabular">{r.evidence.ex_count}</p>
              <p className="text-foreground/50">Exudates</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-foreground/50">
            Evidence: {r.evidence.ma_count} MAs · {r.evidence.hem_count} hems ·{" "}
            {r.evidence.ex_count} exudates · vessel density {r.evidence.vessel_density_pct}%
          </div>
        </div>

        {/* Trust + classification */}
        <div>
          <div className="flex items-center gap-4">
            <TrustDial score={trust.trust_score} size={110} label="trust" />
            <div>
              <p className="text-sm font-semibold text-white">{r.classification.predicted_class}</p>
              <p className="text-xs text-foreground/60 mt-1">
                Confidence {(r.classification.confidence * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-foreground/50 mt-1">{trust.route}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-foreground/50">Consistency</p>
              <p className="text-white font-medium tabular">{r.explainability.consistency.toFixed(2)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-foreground/50">Centroid Δ (DD)</p>
              <p className="text-white font-medium tabular">{r.explainability.centroid_distance_dd}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-foreground/50">Region overlap</p>
              <p className="text-white font-medium tabular">{r.explainability.region_overlap}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-foreground/50">Verdict</p>
              <p className="text-white font-medium">{r.explainability.verdict}</p>
            </div>
          </div>

          {r.evidence.dme_risk && (
            <div className="mt-3 p-2.5 rounded-lg bg-danger/10 border border-danger/40">
              <p className="text-xs font-semibold text-danger">⚠ {r.evidence.dme_message}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button className="flex-1 py-2 rounded-full bg-success/15 border border-success/40 text-success text-xs font-medium hover:bg-success/25">
              ✓ Sign off
            </button>
            <button className="flex-1 py-2 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs font-medium hover:bg-primary/25">
              Escalate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
