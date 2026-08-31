"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { Counter, GlowButton, Reveal } from "@/components/ui";

const EyeScene = dynamic(() => import("@/components/three/EyeScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="w-56 h-56 rounded-full bg-gradient-to-br from-primary/30 to-success/20 blur-2xl animate-breathe" />
    </div>
  ),
});

const MODULES = [
  { n: "01", title: "Trust Gate", desc: "Quality score · recapture if bad", color: "#22D3EE" },
  { n: "02", title: "Evidence Engine", desc: "Lesions · MAs · DME risk", color: "#34D399" },
  { n: "03", title: "CNN Grading", desc: "ICDR 0-4 with confidence", color: "#22D3EE" },
  { n: "04", title: "Grad-CAM", desc: "Explainability heatmap", color: "#34D399" },
  { n: "05", title: "Trust Router", desc: "HIGH · MODERATE · LOW", color: "#FBBF24" },
];

export default function Home() {
  return (
    <div className="bg-surface">
      {/* HERO */}
      <section className="relative h-[100svh] min-h-[560px] overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-radial-fade" />
        <EyeScene />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-5">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-4"
          >
            Trust-Gated Diabetic Retinopathy Screening
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.05] max-w-4xl"
          >
            <span className="text-gradient">DRISHTI</span>
            <span className="block mt-2 text-3xl sm:text-4xl md:text-5xl text-foreground/90">
              AI that knows when to trust itself
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-foreground/60 max-w-2xl text-base sm:text-lg"
          >
            Upload a retina photo and watch the entire diagnostic pipeline run
            live — quality gate, evidence detection, AI grading, Grad-CAM and
            trust routing — ending in a clinical verdict you can trust.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <GlowButton href="/screening">Launch Screening</GlowButton>
            <GlowButton href="/how-it-works" variant="outline">
              Watch it work
            </GlowButton>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM STRIP */}
      <section className="border-y border-primary/10 bg-surface2/40">
        <div className="max-w-7xl mx-auto px-5 py-14 grid gap-8 grid-cols-1 sm:grid-cols-3 text-center">
          <Reveal>
            <div className="text-4xl sm:text-5xl font-bold text-white">
              <Counter to={77} suffix="M" />
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              diabetics in India
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="text-4xl sm:text-5xl font-bold text-white">
              <Counter to={1} /> / <Counter to={100} />
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              ophthalmologist per 100,000 rural patients
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="text-4xl sm:text-5xl font-bold text-success">
              <Counter to={90} suffix="%" />
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              of blindness preventable if caught early
            </p>
          </Reveal>
        </div>
      </section>

      {/* PIPELINE PREVIEW */}
      <section className="max-w-7xl mx-auto px-5 py-24">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            One photo. <span className="text-gradient">Five trusted steps.</span>
          </h2>
          <p className="mt-3 text-foreground/60 max-w-xl mx-auto">
            Every screening runs through an explainable, trust-gated pipeline —
            each stage verified before the verdict.
          </p>
        </Reveal>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {MODULES.map((m, i) => (
            <Reveal key={m.n} delay={i * 0.1} className="flex md:flex-col items-center md:flex-1 gap-3 w-full">
              <div className="flex items-center gap-4 w-full md:flex-col md:gap-0">
                <motion.div
                  className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full glass grid place-items-center relative"
                  animate={{ boxShadow: `0 0 24px ${m.color}33` }}
                >
                  <span className="text-3xl font-bold tabular" style={{ color: m.color }}>
                    {m.n}
                  </span>
                  <span
                    className="absolute inset-2 rounded-full border border-dashed animate-pulseGlow"
                    style={{ borderColor: `${m.color}44` }}
                  />
                </motion.div>
                {i < MODULES.length - 1 && (
                  <div className="h-px w-6 md:h-8 md:w-px bg-gradient-to-r md:bg-gradient-to-b from-primary/30 to-transparent mx-1" />
                )}
              </div>
              <div className="md:mt-3 md:text-center">
                <p className="font-medium text-white">{m.title}</p>
                <p className="text-xs text-foreground/60 mt-1">{m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRUST GATE TEASER */}
      <section className="border-t border-primary/10 bg-surface2/40 py-24">
        <div className="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              The gate that <span className="text-gradient">never blurs</span> a verdict
            </h2>
            <p className="mt-4 text-foreground/60 leading-relaxed">
              A blurry or underexposed photo can silently corrupt an AI result.
              DRISHTI&apos;s Trust Gate scores image quality first — and stamps out
              bad photos before they reach the model.
            </p>
            <div className="mt-8 grid gap-3">
              <div className="glass p-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success" />
                <div>
                  <p className="text-sm font-medium text-white">Quality 0.82 — ACCEPTED</p>
                  <p className="text-xs text-foreground/60">Sharp, well-lit retina → proceeds to grading</p>
                </div>
              </div>
              <div className="glass p-4 flex items-center gap-3 border-danger/30">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">Quality 0.38 — REJECTED · recapture</p>
                  <p className="text-xs text-foreground/60">Blurry image → screened out, asks for a new photo</p>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="glass p-6 relative overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg overflow-hidden border border-success/30">
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-success/10 grid place-items-center">
                    <span className="text-5xl">⚪</span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-success uppercase">Accepted</p>
                    <p className="text-[11px] text-foreground/50">Enhanced & forwarded</p>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden border border-danger/40 bg-danger/5">
                  <div className="h-40 bg-gradient-to-br from-danger/30 to-red-900/20 blur-sm grid place-items-center">
                    <span className="text-5xl opacity-50">⚪</span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-danger uppercase">Rejected</p>
                    <p className="text-[11px] text-foreground/50">RECAPTURE required</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/4 right-1/4 h-2 animate-laser-sweep bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* VALIDATION BANNER */}
      <section className="max-w-7xl mx-auto px-5 py-24">
        <Reveal>
          <div className="glass p-8 md:p-10 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/40 mb-6">
              Validated on 550 held-out APTOS images
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-success tabular">
                  <Counter to={91.0} decimals={1} suffix="%" />
                </div>
                <p className="mt-1 text-sm text-foreground/60">Sensitivity (referable)</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-success tabular">
                  <Counter to={96.0} decimals={1} suffix="%" />
                </div>
                <p className="mt-1 text-sm text-foreground/60">Specificity (referable)</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary tabular">
                  <Counter to={0.895} decimals={3} />
                </div>
                <p className="mt-1 text-sm text-foreground/60">QWK (5-class)</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary tabular">
                  <Counter to={0.975} decimals={3} />
                </div>
                <p className="mt-1 text-sm text-foreground/60">ROC AUC (referable)</p>
              </div>
            </div>
            <Link
              href="/validation"
              className="mt-8 inline-flex text-sm text-primary hover:text-white transition-colors"
            >
              See the full evidence →
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
