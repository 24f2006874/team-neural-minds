# 🌐 DRISHTI — Trust-Gated DR Screening Website

A cinematic, dark-themed medical web platform for **Smart India Hackathon 2026**
(PS 26038, **MathWorks**). A health worker uploads a retina photo and watches
the entire DRISHTI pipeline run live — quality gate → evidence detection →
AI grading → Grad-CAM → trust routing — ending in a color-coded clinical
verdict with a full explainability report.

Built from the project spec in `DRISHTI_WEBSITE_SPEC.md`.

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
+ framer-motion + @react-three/fiber + recharts · FastAPI backend (optional).

---

## ✨ Pages (7)

1. **Home** — 3D hero eye (react-three-fiber), animated counters, live
   pipeline preview, trust-gate teaser, validation banner.
2. **How It Works** — scroll-driven 5-module cards, each with an interactive
   micro-demo (blur slider → trust score, lesion toggles, ICDR bars,
   Grad-CAM crossfade, clinic queue) + the Consistency Check story.
3. **Screening ⭐** — drag & drop upload + 5 demo cases, live 5-stage
   stepper with laser sweep, and a full Clinical Report card
   (grade, confidence, trust dial, DME alert, lesion counts, download).
4. **Doctor Dashboard** — stats cards, patient table with filter tabs, and a
   full report modal (human-in-the-loop workflow).
5. **Validation & Evidence** — metric cards, interactive confusion matrix,
   training curves, and a draggable threshold "policy knob" ROC slider.
6. **Capacity Planner** — sliders for cameras/reviewers/arrivals, live
   outputs, animated queue, district-scaling chart, and presets.
7. **About** — team cards, PS info, resource links, credits & honesty note.

---

## 🚀 Getting started

### Frontend

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

### Backend (optional — the site runs on mock data without it)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8000
```

The frontend reads `NEXT_PUBLIC_API_URL` (see `.env.example`). When the
backend is unreachable, the frontend transparently falls back to realistic
mock data matching the exact JSON contract — so the entire site works 100%
**offline** for stage demos.

The backend imports the existing DRISHTI pipeline from
`DRISHTI_portable/src` if present, otherwise serves a mock result.

---

## 🎨 Design system

Dark medical-tech: background `#060B14` → `#0A1628`, glassmorphism cards
(`backdrop-blur`, 1px cyan borders), accent cyan `#22D3EE`, success green
`#34D399`, review amber `#FBBF24`, urgent red `#F87171`. Fonts: Space Grotesk
(headings) + Inter (body), tabular numerals, 300–400 ms ease-out transitions,
and `prefers-reduced-motion` support.

**The one rule:** trust colors (green/amber/red) are used consistently
everywhere — the same language as the DRISHTI console.

---

## 🔒 Honesty rules (credibility)

- Says "validated on 550 held-out APTOS images" — never "certified" or
  "clinical-grade".
- Always cites: *Data: APTOS 2019, Aravind Eye Hospital (Kaggle)*.
- The review dashboard demonstrates the workflow; demo data is labelled as
  demo.
- Trust thresholds (0.76 / 0.55) and all numbers match the official guides
  exactly.
