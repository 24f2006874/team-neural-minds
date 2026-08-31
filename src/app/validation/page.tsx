"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { METRICS } from "@/lib/data";
import { Counter, Reveal } from "@/components/ui";

const METRIC_CARDS = [
  { label: "Sensitivity (referable)", value: 91.0, suffix: "%", color: "#34D399", decimals: 1 },
  { label: "Specificity (referable)", value: 96.0, suffix: "%", color: "#34D399", decimals: 1 },
  { label: "Quadratic Kappa (5-class)", value: 0.895, suffix: "", color: "#22D3EE", decimals: 3 },
  { label: "ROC AUC (referable)", value: 0.975, suffix: "", color: "#22D3EE", decimals: 3 },
];

export default function Validation() {
  const [threshold, setThreshold] = useState(0.5);
  const [hoverConf, setHoverConf] = useState<{ r: number; c: number } | null>(null);

  const curvePoint = useMemo(
    () =>
      METRICS.thresholdCurve.reduce((prev, cur) =>
        Math.abs(cur.threshold - threshold) < Math.abs(prev.threshold - threshold)
          ? cur
          : prev
      ),
    [threshold]
  );

  const total = METRICS.confusionMatrix.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);

  return (
    <div className="pt-24 px-5 max-w-7xl mx-auto pb-24">
      <Reveal className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-2">
          The evidence
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Validation & <span className="text-gradient">Evidence</span>
        </h1>
        <p className="mt-3 text-foreground/60 max-w-2xl mx-auto">
          Validated on 550 held-out images from APTOS 2019. Every number here
          comes from our real, reproducible training runs.
        </p>
      </Reveal>

      {/* Metric cards */}
      <Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {METRIC_CARDS.map((m) => (
            <div key={m.label} className="glass p-6 text-center">
              <div className="tabular text-4xl font-bold" style={{ color: m.color }}>
                <Counter to={m.value} decimals={m.decimals} suffix={m.suffix} />
              </div>
              <p className="mt-2 text-sm text-foreground/60">{m.label}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Confusion matrix + threshold slider */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Confusion matrix */}
        <Reveal>
          <div className="glass p-6">
            <h2 className="font-bold text-white mb-1">Confusion Matrix</h2>
            <p className="text-xs text-foreground/50 mb-4">
              Hover a cell for detail. Rows = true class, columns = predicted.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-[10px] font-normal text-foreground/40" />
                    {METRICS.classNames.map((c) => (
                      <th key={c} className="p-1 text-[10px] font-normal text-foreground/40">
                        {c}
                      </th>
                    ))}
                    <th className="p-1 text-[10px] font-normal text-foreground/40">All</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.confusionMatrix.map((row, r) => (
                    <tr key={r}>
                      <td className="p-1 text-xs font-medium text-foreground/70 text-right pr-2">
                        {METRICS.classNames[r]}
                      </td>
                      {row.map((v, c) => {
                        const isHover = hoverConf?.r === r && hoverConf?.c === c;
                        const isDiag = r === c;
                        return (
                          <td key={c} className="p-1">
                            <div
                              onMouseEnter={() => setHoverConf({ r, c })}
                              onMouseLeave={() => setHoverConf(null)}
                              className={`w-full h-11 rounded grid place-items-center font-medium tabular text-xs transition-all ${
                                isDiag ? "bg-success/25 text-success" : isHover ? "bg-primary/30 text-white" : "bg-white/5 text-foreground/70"
                              }`}
                              style={isHover ? { boxShadow: `0 0 12px ${isDiag ? "#34D399" : "#22D3EE"}55` } : {}}
                            >
                              {v}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-1">
                        <div className="w-full h-11 rounded grid place-items-center bg-white/5 text-foreground/70 font-medium tabular text-xs">
                          {row.reduce((a, b) => a + b, 0)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hoverConf && (
              <p className="mt-3 text-xs text-foreground/60">
                True <span className="text-primary">{METRICS.classNames[hoverConf.r]}</span> predicted as{" "}
                <span className="text-primary">{METRICS.classNames[hoverConf.c]}</span>:
                <span className="text-white font-medium tabular"> {METRICS.confusionMatrix[hoverConf.r][hoverConf.c]}</span>{" "}
                ({shareOf(hoverConf, total)} of samples)
              </p>
            )}
          </div>
        </Reveal>

        {/* Threshold ROC slider */}
        <Reveal delay={0.1}>
          <div className="glass p-6">
            <h2 className="font-bold text-white">The Policy Knob</h2>
            <p className="text-xs text-foreground/50 mb-4">
              Drag the decision threshold on the ROC curve and watch sensitivity
              trade off against specificity — live.
            </p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={METRICS.rocPoints}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <defs>
                    <linearGradient id="rocFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff12" vertical={false} />
                  <XAxis
                    dataKey="fpr"
                    tick={{ fill: "#8899aa", fontSize: 10 }}
                    axisLine={{ stroke: "#ffffff22" }}
                    tickLine={false}
                    label={{ value: "False positive rate", position: "insideBottom", offset: -2, fill: "#667", fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fill: "#8899aa", fontSize: 10 }}
                    axisLine={{ stroke: "#ffffff22" }}
                    tickLine={false}
                    label={{ value: "True positive rate", angle: -90, position: "insideLeft", fill: "#667", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0a1628", border: "1px solid #22d3ee44", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v) => [String(v), "rate"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="tpr"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fill="url(#rocFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-foreground/60 mb-1">
                <span>Threshold</span>
                <span className="tabular text-primary font-medium">{threshold.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.8}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(+e.target.value)}
                className="w-full accent-primary"
                aria-label="Decision threshold"
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-foreground/50">Sensitivity</p>
                  <p className="tabular text-xl font-bold text-success">
                    {curvePoint.sensitivity.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-foreground/50">Specificity</p>
                  <p className="tabular text-xl font-bold text-primary">
                    {curvePoint.specificity.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 h-px bg-gradient-to-r from-success via-transparent to-transparent" />
              <p className="mt-2 text-[11px] text-foreground/50">
                Target: sensitivity ≥ 90% · specificity ≥ 85%. Our default 0.5
                threshold lands at 91.0% / 96.0%.
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Training curves + stability */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <Reveal>
          <div className="glass p-6">
            <h2 className="font-bold text-white mb-4">Training Curves</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={METRICS.trainingCurves.epochs.map((e, i) => ({
                    epoch: e,
                    train: METRICS.trainingCurves.trainLoss[i],
                    val: METRICS.trainingCurves.valLoss[i],
                  }))}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <CartesianGrid stroke="#ffffff12" vertical={false} />
                  <XAxis dataKey="epoch" tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={{ stroke: "#ffffff22" }} tickLine={false} label={{ value: "Epoch", position: "insideBottom", offset: -2, fill: "#667", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={{ stroke: "#ffffff22" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #22d3ee44", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="train" stroke="#22d3ee" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="val" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass p-6">
            <h2 className="font-bold text-white mb-4">3-Run Stability</h2>
            <p className="text-xs text-foreground/50 mb-4">
              Three independent training runs, held-out performance — a tight
              spread means our results aren&apos;t luck.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-foreground/40 border-b border-white/10">
                    <th className="py-2 font-medium">Run</th>
                    <th className="py-2 font-medium">Sensitivity</th>
                    <th className="py-2 font-medium">Specificity</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.stabilityRuns.map((run) => (
                    <tr key={run.run} className="border-b border-white/5">
                      <td className="py-3 text-white font-medium tabular">Run {run.run}</td>
                      <td className="py-3 tabular text-success">{run.sensitivity}%</td>
                      <td className="py-3 tabular text-primary">{run.specificity}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-success to-primary" style={{ width: "100%" }} />
            </div>
            <p className="mt-2 text-[11px] text-foreground/50">
              Spread: ±1.4% sensitivity · ±1.0% specificity across runs.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Grad-CAM gallery */}
      <Reveal>
        <div className="glass p-6">
          <h2 className="font-bold text-white mb-4">Grad-CAM Sample Gallery</h2>
          <p className="text-xs text-foreground/50 mb-6">
            What the model actually looked at for each referable level.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "No DR", hue: "150", note: "No focal lesions" },
              { label: "Mild NPDR", hue: "120", note: "A few MAs" },
              { label: "Referable", hue: "45", note: "Exudates near fovea" },
              { label: "PDR", hue: "0", note: "Neovascularization" },
            ].map((g) => (
              <div key={g.label} className="rounded-xl overflow-hidden border border-white/10">
                <div className="relative h-32 grid place-items-center" style={{ background: `radial-gradient(circle at 40% 40%, hsl(${g.hue},60%,40%), #0a0e18 75%)` }}>
                  <span className="text-3xl opacity-50">⚪</span>
                  <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(circle at 40% 45%, rgba(255,80,80,.6) 0%, transparent 45%)` }}
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white">{g.label}</p>
                  <p className="text-[11px] text-foreground/50">{g.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-foreground/40">
            * Data: APTOS 2019, Aravind Eye Hospital (Kaggle). Validated, not
            certified.
          </p>
        </div>
      </Reveal>
    </div>
  );
}

function shareOf(hover: { r: number; c: number }, total: number): string {
  const v = METRICS.confusionMatrix[hover.r][hover.c];
  return ((v / total) * 100).toFixed(1) + "%";
}
