"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { trustColor, trustLevel } from "@/lib/types";

const COLOR_HEX: Record<string, string> = {
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
};

export function TrustDial({
  score,
  size = 140,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | undefined;
    let raf: number;
    const step = (ts: number) => {
      if (start === undefined) start = ts;
      const p = Math.min(1, (ts - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(score * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const colorHex = COLOR_HEX[trustColor(val)];
  const level = trustLevel(val);
  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }} role="img" aria-label={`Trust score ${Math.round(val * 100)} percent, ${level}`}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#0d1626" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={colorHex}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - val)}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke .2s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular font-bold text-2xl" style={{ color: colorHex }}>
          {Math.round(val * 100)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-foreground/50">
          {label || "trust"}
        </span>
      </div>
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ color: colorHex, backgroundColor: `${colorHex}1a`, border: `1px solid ${colorHex}44` }}
      >
        {level}
      </motion.div>
    </div>
  );
}
