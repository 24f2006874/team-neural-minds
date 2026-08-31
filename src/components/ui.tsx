"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import type { TrustColor, TrustLevel } from "@/lib/types";

const COLOR_MAP: Record<TrustColor, string> = {
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
};

export function TrustBadge({
  level,
  score,
}: {
  level: TrustLevel;
  score?: number;
}) {
  const color =
    level === "HIGH" ? COLOR_MAP.success : level === "MODERATE" ? COLOR_MAP.warning : COLOR_MAP.danger;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
      style={{
        color,
        backgroundColor: `${color}1a`,
        border: `1px solid ${color}55`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {level}
      {score !== undefined && <span className="tabular font-normal opacity-80">{Math.round(score * 100)}%</span>}
    </span>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export function useCountUp(target: number, duration = 1.4, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    let start: number | undefined;
    let raf: number;
    const step = (ts: number) => {
      if (start === undefined) start = ts;
      const p = Math.min(1, (ts - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  const display = value.toFixed(decimals);
  return { ref, value, display };
}

export function Counter({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const { ref, display } = useCountUp(to, 1.4, decimals);
  return (
    <span ref={ref} className={`tabular ${className || ""}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function GlowButton({
  children,
  href,
  variant = "solid",
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "solid" | "outline" | "green";
  onClick?: () => void;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300";
  const styles =
    variant === "solid"
      ? "bg-primary text-surface hover:bg-primary/80 shadow-glow"
      : variant === "green"
      ? "bg-success text-surface hover:bg-success/80 shadow-glow"
      : "border border-primary/40 text-primary hover:bg-primary/10";
  const cls = `${base} ${styles} ${className}`;
  if (href)
    return (
      <a href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
