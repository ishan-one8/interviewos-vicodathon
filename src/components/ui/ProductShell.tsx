"use client";

import Link from "next/link";
import React, { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { CursorGlow } from "@/components/visual/CursorGlow";

interface ProductShellProps {
  children: React.ReactNode;
  activeRoute?: "home" | "interview" | "demo" | "about";
}

function OrbitMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="2.5" className="fill-indigo-400" />
      <path d="M10 3a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-400/70" />
      <path d="M3 10a7 7 0 0 1 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-500/40" />
      <path d="M10 17a7 7 0 0 1-7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-400/70" />
      <path d="M17 10a7 7 0 0 1-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-500/40" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#watch-it-adapt", label: "Watch It Adapt" },
  { href: "/#showcase", label: "Product" },
];

export function ProductShell({ children, activeRoute = "home" }: ProductShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const showCTA = activeRoute !== "interview" && activeRoute !== "demo";

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      <CursorGlow />

      <header className="relative z-50 border-b border-[var(--border)] px-4 md:px-8 py-3 flex items-center justify-between bg-[var(--background)]/70 backdrop-blur-xl sticky top-0">
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg p-0.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <OrbitMark />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-200 group-hover:text-white transition-colors">
            Interview<span className="text-indigo-400">OS</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-underline text-xs text-zinc-500 hover:text-zinc-200 transition-colors">
              {l.label}
            </Link>
          ))}

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--border)] text-[11px] text-zinc-500 font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Engine Active
          </div>

          {showCTA && (
            <Link
              href="/demo"
              className="group relative overflow-hidden press px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 shadow-lg shadow-indigo-600/25"
            >
              <span className="beam" />
              <span className="relative">Experience Interview</span>
              <ArrowRight className="relative h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden relative z-40 menu-in border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl px-4 py-4 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/demo"
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium"
          >
            Experience InterviewOS
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col">{children}</div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[var(--background)]/40 backdrop-blur-sm px-6 md:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <OrbitMark className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-sm text-zinc-200">
                Interview<span className="text-indigo-400">OS</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Adaptive Technical Interview Intelligence — context-aware, cross-turn memory, evidence-backed evaluation.
            </p>
          </div>

          <div className="flex gap-12">
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Product</div>
              <Link href="/#how-it-works" className="block text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors">How It Works</Link>
              <Link href="/#watch-it-adapt" className="block text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors">Watch It Adapt</Link>
              <Link href="/demo" className="block text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors">Experience</Link>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Status</div>
              <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Engine Active
              </div>
              <div className="text-[11px] text-zinc-700 font-mono pt-1">ViCodathon 2026</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
