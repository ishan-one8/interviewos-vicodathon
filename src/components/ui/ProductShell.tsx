"use client";

import Link from "next/link";
import React from "react";
import { Brain, ArrowRight, ShieldCheck } from "lucide-react";

interface ProductShellProps {
  children: React.ReactNode;
  activeRoute?: "home" | "interview" | "demo" | "about";
}

export function ProductShell({ children, activeRoute = "home" }: ProductShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 transition-colors shadow-sm shadow-indigo-500/10">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                  Interview<span className="text-indigo-400">OS</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Adaptive AI Technical Interviewer</p>
            </div>
          </Link>
        </div>

        {/* Minimal Navigation & CTAs */}
        <nav className="flex items-center gap-3 md:gap-6">
          <Link
            href="/#capabilities"
            className="hidden md:inline-flex text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none focus:text-white"
          >
            How It Works
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/60 text-[11px] text-zinc-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden md:inline">Adaptive Engine Ready</span>
            <span className="md:hidden">Ready</span>
          </div>

          {activeRoute !== "interview" && activeRoute !== "demo" && (
            <Link
              href="/demo"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <span>Try Demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </nav>
      </header>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-6 bg-zinc-950/80 text-zinc-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-zinc-400" />
          <span>InterviewOS • Evidence-Backed Technical AI Interview Agent</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-500 font-mono text-[11px]">
          <span>ViCodathon 2026</span>
          <span>•</span>
          <Link href="/api/debug/data" className="hover:text-zinc-300 transition-colors">
            Debug Data
          </Link>
        </div>
      </footer>
    </div>
  );
}
