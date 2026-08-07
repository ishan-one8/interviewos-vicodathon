"use client";

import Link from "next/link";
import { ProductShell } from "@/components/ui/ProductShell";
import {
  ArrowRight,
  Compass,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <ProductShell activeRoute="home">
      <main className="flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto w-full px-4 md:px-8 py-12 md:py-20 flex flex-col items-center text-center space-y-8">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-mono font-medium shadow-sm shadow-indigo-500/10">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            ADAPTIVE TECHNICAL INTERVIEWS
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-100 max-w-3xl leading-[1.15]">
            An interview that thinks <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-400 to-cyan-300">
              between your answers.
            </span>
          </h1>

          {/* Truthful Supporting Copy */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
            InterviewOS uses candidate learning history, adaptive questioning,
            evidence-backed evaluation, and deterministic interview guardrails to
            conduct personalized technical interviews.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href="/interview"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <span>Start Interview</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              See How It Works
            </a>
          </div>

          {/* Hero Visual: Product-Native Pipeline Visualization (Section 6) */}
          <div className="w-full max-w-4xl pt-8">
            <div className="p-6 md:p-8 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-black/60 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span>InterviewOS Live Pipeline Flow</span>
                </div>
                <span>Deterministic State Machine Engine</span>
              </div>

              {/* Animated Interactive Pipeline Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/70 space-y-2 relative group hover:border-indigo-500/40 transition-colors">
                  <div className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">
                    01 • Candidate Context
                  </div>
                  <div className="font-semibold text-sm text-zinc-200">Learning History</div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Loads completed missions, retry patterns, and skipped curriculum days.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/70 space-y-2 relative group hover:border-indigo-500/40 transition-colors">
                  <div className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">
                    02 • Question Strategy
                  </div>
                  <div className="font-semibold text-sm text-zinc-200">Adaptive Planner</div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Selects topic, curriculum day, and difficulty based on performance signals.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/70 space-y-2 relative group hover:border-indigo-500/40 transition-colors">
                  <div className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">
                    03 • Live Answer
                  </div>
                  <div className="font-semibold text-sm text-zinc-200">Answer Intelligence</div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Evaluates correctness, depth, reasoning, and claims against evidence ledger.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/70 space-y-2 relative group hover:border-indigo-500/40 transition-colors">
                  <div className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">
                    04 • Adaptive Follow-up
                  </div>
                  <div className="font-semibold text-sm text-zinc-200">Evidence Aggregation</div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Escalates difficulty on strength or probes foundation on partial answers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Homepage Product Proof Section (Section 33) */}
        <section id="how-it-works" className="border-t border-zinc-900 bg-zinc-950/60 py-16 px-4 md:px-8">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
                How InterviewOS Evaluates Engineers
              </h2>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto">
                A 4-step evidence pipeline operating under strict deterministic guardrails.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Proof Step 1 */}
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
                  1
                </div>
                <h3 className="font-semibold text-base text-zinc-100">Understands Candidate Background</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Analyzes cohort data, completed curriculum missions, retry days, and skipped topics to form initial topic preferences without guessing skills.
                </p>
              </div>

              {/* Proof Step 2 */}
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
                  2
                </div>
                <h3 className="font-semibold text-base text-zinc-100">Plans the Right Question Strategy</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Decides target topic, curriculum day, action (new topic, deepen, probe, challenge), and difficulty level using a deterministic scoring engine.
                </p>
              </div>

              {/* Proof Step 3 */}
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
                  3
                </div>
                <h3 className="font-semibold text-base text-zinc-100">Learns & Adapts From Each Answer</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Extracts technical claims, tracks cross-turn memory, flags contradictions, and updates the evidence ledger after every single response.
                </p>
              </div>

              {/* Proof Step 4 */}
              <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
                  4
                </div>
                <h3 className="font-semibold text-base text-zinc-100">Produces Evidence-Backed Reports</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Aggregates competency scores across 5 dimensions with complete evidence provenance, strengths, development areas, and actionable feedback.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* System Capabilities Section (Section 7) */}
        <section id="capabilities" className="border-t border-zinc-900 py-16 px-4 md:px-8">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-mono">
                <Shield className="h-3.5 w-3.5" />
                SYSTEM GUARANTEES
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
                Built for Technical Rigor
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <Compass className="h-6 w-6 text-indigo-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Adaptive Questioning</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Questions naturally deepen when candidates excel and probe foundations when responses are partial or unclear.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <Layers className="h-6 w-6 text-cyan-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Curriculum Coverage</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Mandatory state-machine rules enforce at least 8 questions across at least 4 unique AI curriculum days before completion.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Evidence-Backed Feedback</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every score and evaluation finding links directly back to specific answer turn IDs and verified evidence entries.
                </p>
              </div>
            </div>

            {/* Direct CTA Panel */}
            <div className="p-8 rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-indigo-950/20 to-zinc-900 text-center space-y-4">
              <h3 className="text-xl font-bold text-zinc-100">Ready to Experience InterviewOS?</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Launch an interactive interview session with Ari to test adaptive AI questioning live.
              </p>
              <div>
                <Link
                  href="/interview"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
                >
                  <span>Start Technical Interview</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ProductShell>
  );
}
