"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/screening", label: "Screening" },
  { href: "/dashboard", label: "Doctor" },
  { href: "/validation", label: "Evidence" },
  { href: "/planner", label: "Capacity" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-strong border-x-0 border-t-0 rounded-none">
      <nav className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 grid place-items-center shadow-glow-sm">
            <span className="w-3 h-3 rounded-full bg-primary animate-pulseGlow" />
          </span>
          <span className="font-heading font-bold text-lg tracking-tight text-white">
            DRISHTI
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm text-foreground/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <Link
          href="/screening"
          className="hidden lg:inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-primary text-surface hover:bg-primary/80 transition-colors shadow-glow-sm"
        >
          Launch Screening
        </Link>

        <button
          className="lg:hidden text-foreground p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:hidden overflow-hidden glass-strong border-x-0 border-b-0 rounded-none"
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm text-foreground/80 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/screening"
                onClick={() => setOpen(false)}
                className="mt-2 px-4 py-2.5 text-center text-sm font-medium rounded-full bg-primary text-surface"
              >
                Launch Screening
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
