"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui";
import { fetchMatlabStatus } from "@/lib/api";

function ModuleCard({
  n,
  title,
  tagline,
  desc,
  children,
  color = "#22D3EE",
}: {
  n: string;
  title: string;
  tagline: string;
  desc: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Reveal className="w-full">
      <div className="glass p-6 sm:p-8 hover:border-primary/40 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <span
            className="w-10 h-10 rounded-lg grid place-items-center font-heading font-bold text-sm"
            style={{ backgroundColor: `${color}1a`, color, border: `1px solid ${color}44` }}
          >
            {n}
          </span>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-xs text-primary">{tagline}</p>
          </div>
        </div>
        <p className="text-sm text-foreground/65 leading-relaxed mb-6">{desc}</p>
        <div className="rounded-xl bg-surface2/60 border border-white/5 p-4">{children}</div>
      </div>
    </Reveal>
  );
}

// Module 1: blur slider → trust score
function BlurDemo() {
  const [blur, setBlur] = useState(0);
  const score = Math.max(0, 0.96 - blur * 0.012);
  const color = score >= 0.76 ? "#34D399" : score >= 0.55 ? "#FBBF24" : "#F87171";
  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-foreground/60">Image sharpness</span>
        <span className="tabular font-medium" style={{ color }}>
          Trust {Math.round(score * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div
          className="w-32 h-32 rounded-xl shrink-0 overflow-hidden border border-white/10 grid place-items-center text-4xl bg-surface"
          style={{ filter: `blur(${blur / 4}px) opacity(${0.6 + blur * 0.005})` }}
        >
          <span className="opacity-60">👁️</span>
        </div>
        <input
          type="range"
          min={0}
          max={80}
          value={blur}
          onChange={(e) => setBlur(+e.target.value)}
          className="flex-1 accent-primary"
          aria-label="Blur slider"
        />
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${score * 100}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-2 text-[11px] text-foreground/40">
        {score < 0.55
          ? "REJECTED — recapture image"
          : score < 0.76
          ? "MODERATE — flag for review"
          : "ACCEPTED — proceed to grading"}
      </p>
    </div>
  );
}

// Module 2: lesion layer toggles
function LesionLayers() {
  const [vessels, setVessels] = useState(true);
  const [mas, setMas] = useState(true);
  const [exudates, setExudates] = useState(true);
  const [dme, setDme] = useState(true);
  const layers = [
    { key: "vessels", label: "Vessels", on: vessels, set: setVessels, color: "#22D3EE" },
    { key: "mas", label: "Microaneurysms", on: mas, set: setMas, color: "#34D399" },
    { key: "ex", label: "Exudates", on: exudates, set: setExudates, color: "#FBBF24" },
    { key: "dme", label: "DME zone", on: dme, set: setDme, color: "#F87171" },
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        {layers.map((l) => (
          <button
            key={l.key}
            onClick={() => l.set(!l.on)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: l.on ? `${l.color}1f` : "transparent",
              color: l.on ? l.color : "#888",
              border: `1px solid ${l.on ? l.color : "#333"}55`,
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="relative h-28 rounded-xl overflow-hidden border border-white/10 bg-surface grid place-items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        {vessels && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[15, 30, 45, 60, 75, 85].map((y, i) => (
              <path
                key={i}
                d={`M0 ${y} C30 ${y - 15}, 70 ${y + 10}, 100 ${y - 5}`}
                stroke="#22D3EE"
                strokeWidth="0.7"
                fill="none"
                opacity="0.6"
              />
            ))}
          </svg>
        )}
        {mas && (
          <>
            {[[30, 40, 4, "#34D399"], [55, 55, 5, "#34D399"], [70, 35, 3, "#34D399"], [42, 65, 4, "#34D399"]].map(
              ([x, y, r, c], i) => (
                <span
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{ left: `${x}%`, top: `${y}%`, width: r, height: r, backgroundColor: c as string }}
                />
              )
            )}
          </>
        )}
        {exudates && (
          <>
            {[[60, 50, "#FBBF24"], [48, 42, "#FBBF24"], [73, 60, "#FBBF24"]].map(([x, y, c], i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{ left: `${x}%`, top: `${y}%`, width: 9, height: 7, backgroundColor: c as string, opacity: 0.8 }}
              />
            ))}
          </>
        )}
        {dme && (
          <span className="absolute rounded-full border-2 border-dashed border-danger/70 animate-breathe" style={{ left: "40%", top: "35%", width: "30%", height: "40%", opacity: 0.7 }} />
        )}
      </div>
    </div>
  );
}

// Module 3: ICDR scale with probability bars
function IcdrDemo() {
  const probs = [
    { label: "No DR (0)", v: 0.05, c: "#34D399" },
    { label: "Mild (1)", v: 0.08, c: "#34D399" },
    { label: "Referable (2-3)", v: 0.79, c: "#FBBF24" },
    { label: "PDR (4)", v: 0.08, c: "#F87171" },
  ];
  return (
    <div>
      <div className="flex flex-col gap-3">
        {probs.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-foreground/60">{p.label}</span>
            <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded"
                initial={{ width: 0 }}
                whileInView={{ width: `${p.v * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                style={{ backgroundColor: p.c }}
              />
            </div>
            <span className="tabular text-xs font-medium" style={{ color: p.c }}>
              {(p.v * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-foreground/50">
        Predicted: <span className="text-warning font-medium">NPDR — Referable (Level 2-3)</span> · confidence 0.79
      </div>
    </div>
  );
}

// Module 4: Grad-CAM heatmap crossfade
function GradCamDemo() {
  const [heat, setHeat] = useState(0.5);
  return (
    <div>
      <div className="relative h-32 rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a2f4a] to-[#0a1628]">
        <div className="absolute inset-0 grid place-items-center text-3xl opacity-50">⚪</div>
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: heat,
            background:
              "radial-gradient(circle at 40% 45%, rgba(248,113,113,0.7) 0%, rgba(251,191,36,0.5) 30%, rgba(52,211,153,0.3) 55%, transparent 75%)",
          }}
        />
        <div className="absolute bottom-2 right-2 text-[10px] bg-black/50 px-2 py-0.5 rounded">
          Grad-CAM
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs text-foreground/60">Heatmap</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={heat}
          onChange={(e) => setHeat(+e.target.value)}
          className="flex-1 accent-primary"
          aria-label="Grad-CAM intensity"
        />
      </div>
      <div className="mt-2 text-xs text-foreground/50">
        Consistency check: <span className="text-success font-medium">0.90 / 1.0</span> — model focuses on the same lesion region every pass
      </div>
    </div>
  );
}

// Module 5: animated clinic queue
function QueueDemo() {
  return (
    <div>
      <div className="text-xs text-foreground/50 mb-3">Clinic queue — throughput simulation</div>
      <div className="flex items-end gap-1 h-24 items-center relative overflow-hidden">
        {[30, 55, 40, 70, 35, 60, 45, 80, 50, 66].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t bg-primary/50 border-t-2 border-primary"
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.07, ease: "easeOut" }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/5 rounded p-2">
          <p className="tabular text-lg font-bold text-success">142</p>
          <p className="text-[10px] text-foreground/50">patients/day</p>
        </div>
        <div className="bg-white/5 rounded p-2">
          <p className="tabular text-lg font-bold text-primary">4.2k</p>
          <p className="text-[10px] text-foreground/50">patients/month</p>
        </div>
        <div className="bg-white/5 rounded p-2">
          <p className="tabular text-lg font-bold text-warning">82%</p>
          <p className="text-[10px] text-foreground/50">camera utilization</p>
        </div>
      </div>
    </div>
  );
}

const MODULES = [
  {
    n: "01",
    title: "Trust Gate",
    tagline: "Quality first",
    color: "#22D3EE",
    desc: "Scores image quality before anything else. A blurry or underexposed photo is rejected early — because a GIGO input silently corrupts any downstream AI verdict.",
    demo: <BlurDemo />,
  },
  {
    n: "02",
    title: "Evidence Engine",
    tagline: "What does it see?",
    color: "#34D399",
    desc: "Segments the exact lesions: microaneurysms, hemorrhages, exudates and vessel density — and flags the DME zone if exudate sits dangerously close to the fovea.",
    demo: <LesionLayers />,
  },
  {
    n: "03",
    title: "CNN Grading",
    tagline: "ICDR 0-4",
    color: "#22D3EE",
    desc: "A convolutional network assigns the International Classification of Diabetic Retinopathy scale grade, with honest probability bars across all classes.",
    demo: <IcdrDemo />,
  },
  {
    n: "04",
    title: "Grad-CAM",
    tagline: "Explainable AI",
    color: "#34D399",
    desc: "A Grad-CAM heatmap shows exactly where the model looked. Then we run a Consistency Check — the model must find the same lesion region across passes, or confidence drops.",
    demo: <GradCamDemo />,
  },
  {
    n: "05",
    title: "Trust Router",
    tagline: "Know when to trust itself",
    color: "#FBBF24",
    desc: "Combines quality, evidence and consistency into a single trust score — then routes the case: auto-clear, send to a doctor for review, or escalate as urgent.",
    demo: <QueueDemo />,
  },
];

export default function HowItWorks() {
  return (
    <div className="pt-24 max-w-4xl mx-auto px-5">
      <Reveal className="text-center mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-3">
          The pipeline
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          How DRISHTI <span className="text-gradient">works</span>
        </h1>
        <p className="mt-4 text-foreground/60 max-w-2xl mx-auto">
          Five modules, chained into one explainable, trust-gated screening
          pipeline. Scroll through each stage and try the demo.
        </p>
      </Reveal>

      <div className="mt-16 flex flex-col gap-8">
        {MODULES.map((m) => (
          <ModuleCard key={m.n} n={m.n} title={m.title} tagline={m.tagline} desc={m.desc} color={m.color}>
            {m.demo}
          </ModuleCard>
        ))}
      </div>

      {/* What makes us different */}
      <section className="mt-20 mb-24">
        <Reveal>
          <div className="glass p-8 sm:p-10 border-success/20">
            <p className="text-xs uppercase tracking-[0.25em] text-success mb-4">
              What makes us different
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              The Consistency Check story
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              Most DR screening models tell you <em>what</em> they predict — but
              not <em>why</em>, or whether you should believe them. DRISHTI runs
              the Grad-CAM interpretation <strong>multiple times</strong> and
              measures whether the model is staring at the same disease region
              every pass. If it flip-flops between unrelated areas, the
              explanation is fragile — so the trust score drops and the case is
              routed to a human.
            </p>
            <p className="mt-4 text-foreground/65 leading-relaxed">
              That is the difference between a black box and a referee: DRISHTI
              doesn&apos;t just grade your retina, it grades{" "}
              <span className="text-primary font-medium">its own confidence</span>{" "}
              in doing so.
            </p>
          </div>
        </Reveal>
      </section>

      {/* MATLAB / Model-Based Design */}
      <section className="mt-16 mb-24">
        <Reveal>
          <div className="glass p-8 sm:p-10 border-primary/20">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
                  Model-based design
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Built as a MATLAB pipeline
                </h2>
              </div>
              <MatlabBadge />
            </div>

            <p className="text-foreground/65 leading-relaxed mb-6">
              DRISHTI was originally specified as a MATLAB-based pipeline (SIH
              2026 · PS 26038 · MathWorks). The five modules ship both as MATLAB
              (              <code className="font-mono text-primary/90 rounded bg-surface px-1.5 py-0.5">.m</code>) and as a faithful Python port so the
              web demo runs anywhere. On any machine with the MATLAB Engine for
              Python installed, the screening you run here executes the actual
              <code className="font-mono text-primary/90 rounded bg-surface px-1.5 py-0.5">DRISHTI.m</code> pipeline; otherwise it
              transparently uses the equivalent Python port.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { f: "module1_quality_gate.m", m: "Trust gate · Image Processing Toolbox", d: "Focus, illumination, FOV scoring + ACCEPT/ENHANCE/REJECT" },
                { f: "module2_evidence_engine.m", m: "Evidence · Image/Computer Vision Toolbox", d: "Vessels, OD/fovea localisation, lesion segmentation" },
                { f: "module3_train_resnet.m", m: "CNN grading · Deep Learning Toolbox", d: "ResNet-50 fine-tune on the ICDR 0-4 scale" },
                { f: "module4_explainability.m", m: "Explainability · Deep Learning Toolbox", d: "Grad-CAM + consistency + calibrated confidence + trust" },
                { f: "module5_build_simulink.m", m: "Capacity · Simulink + SimEvents", d: "Builds DRISHTI_CapacityPlanner.slx discrete-event model" },
              ].map((row) => (
                <div key={row.f} className="rounded-xl bg-surface2/60 border border-white/5 p-4">
                  <p className="text-sm font-mono text-primary">{row.f}</p>
                  <p className="mt-1 text-xs text-foreground/70">{row.m}</p>
                  <p className="mt-1 text-xs text-foreground/50">{row.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-surface2/60 border border-white/5 p-4 text-sm text-foreground/70 leading-relaxed">
              <span className="text-primary font-medium">Simulink capacity model.</span>{" "}
              The planner page is driven by the same queuing model that
              <code className="font-mono text-primary/90 rounded bg-surface px-1.5 py-0.5">module5_build_simulink.m</code> builds as{" "}
              <code className="font-mono text-primary/90 rounded bg-surface px-1.5 py-0.5">DRISHTI_CapacityPlanner.slx</code> — patient
              arrivals → acquisition queue → cameras → AI processing → review
              queue → ophthalmologist. It answers the district-scale{" "}
              <em>what-if</em> question (cameras vs. reviewers vs. arrivals) for
              100k+ patients/year.
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function MatlabBadge() {
  const [status, setStatus] = useState<{ using?: string; detail?: string } | null>(null);
  useEffect(() => {
    let live = true;
    fetchMatlabStatus().then((s) => live && setStatus(s)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const on = status?.using === "matlab";
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: on ? "#34D3991f" : "#22D3EE1f",
        color: on ? "#34D399" : "#22D3EE",
        border: `1px solid ${on ? "#34D399" : "#22D3EE"}44`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: on ? "#34D399" : "#22D3EE" }}
      />
      {on ? "MATLAB Engine active" : "Python port active"}
    </div>
  );
}
