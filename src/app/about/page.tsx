import Link from "next/link";
import { Reveal } from "@/components/ui";
import { PS_INFO } from "@/lib/data";

const TEAM = [
  { name: "Lead ML Engineer", role: "Model & Pipeline", desc: "CNN grading, Grad-CAM explainability, segmentations and the full Python pipeline.", initials: "ML" },
  { name: "Trust & Safety", role: "Quality Gate & Router", desc: "Image-quality gate, consistency check and the trust router that decides HIGH / MODERATE / LOW.", initials: "TS" },
  { name: "Data & Validation", role: "Benchmarks", desc: "APTOS evaluation, ROC curves, confusion matrices and the 3-run stability study.", initials: "DV" },
  { name: "Backend & API", role: "FastAPI", desc: "Server architecture, SQLite storage, report rendering and the /api/screen contract.", initials: "BA" },
  { name: "Frontend & Design", role: "Web Platform", desc: "This cinematic screening app, the doctor dashboard and the capacity planner.", initials: "FD" },
  { name: "Product Lead", role: "Vision & Tie-out", desc: "Problem framing, stakeholder shaping and keeping the honesty rules intact.", initials: "PL" },
];

export default function About() {
  return (
    <div className="pt-24 px-5 max-w-5xl mx-auto pb-24">
      <Reveal className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-2">
          About the project
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Team <span className="text-gradient">Neural Minds</span>
        </h1>
        <p className="mt-3 text-foreground/60 max-w-2xl mx-auto">
          Building trust-gated diabetic retinopathy screening for Smart India
          Hackathon 2026 under Problem Statement {PS_INFO.psId}, sponsored by
          {PS_INFO.sponsor}.
        </p>
      </Reveal>

      {/* PS info */}
      <Reveal>
        <div className="glass p-8 mb-12">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/40">Problem statement</p>
              <p className="mt-1 text-xl font-bold text-white">{PS_INFO.psId}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/40">Sponsor</p>
              <p className="mt-1 text-xl font-bold text-white">{PS_INFO.sponsor}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/40">The problem</p>
              <p className="mt-1 text-sm text-foreground/80 leading-snug">
                Making DR screening trustworthy enough to deploy without an
                ophthalmologist present.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Team cards */}
      <Reveal>
        <h2 className="text-2xl font-bold text-white mb-6">The team</h2>
      </Reveal>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {TEAM.map((m, i) => (
          <Reveal key={m.name} delay={i * 0.06}>
            <div className="glass p-6 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 grid place-items-center font-bold text-primary mb-3">
                {m.initials}
              </div>
              <p className="font-bold text-white">{m.name}</p>
              <p className="text-xs text-primary mb-2">{m.role}</p>
              <p className="text-xs text-foreground/60 leading-relaxed">{m.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Links & credits */}
      <div className="grid md:grid-cols-2 gap-6">
        <Reveal>
          <div className="glass p-6">
            <h3 className="font-bold text-white mb-3">Resources</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="https://github.com" className="text-primary hover:text-white transition-colors">
                GitHub repository →
              </Link>
              <Link href="https://www.kaggle.com/c/aptos2019-blindness-detection" className="text-primary hover:text-white transition-colors">
                APTOS 2019 blindness detection dataset →
              </Link>
              <Link href="/validation" className="text-primary hover:text-white transition-colors">
                Validation & evidence →
              </Link>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glass p-6">
            <h3 className="font-bold text-white mb-3">Credits & honesty</h3>
            <p className="text-xs text-foreground/65 leading-relaxed">
              Data: APTOS 2019 Blindness Detection (Aravind Eye Hospital) and
              STARE (Clemson University). Our models are{" "}
              <strong className="text-foreground/85">validated</strong> on 550
              held-out APTOS images — they are not certified or clinical-grade.
              This platform demonstrates a screening workflow; demo cases are
              labelled as demo.
            </p>
            <p className="mt-3 text-xs text-foreground/50">
              © 2026 DRISHTI · Smart India Hackathon Finale.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
