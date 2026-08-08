"use client";

import React from "react";
import Link from "next/link";
import { ProductShell } from "@/components/ui/ProductShell";
import { AuroraBackground } from "@/components/visual/AuroraBackground";
import { AdaptiveCore } from "@/components/visual/AdaptiveCore";
import { Reveal } from "@/components/visual/Reveal";
import { TypeReveal } from "@/components/visual/TypeReveal";
import { AriCore } from "@/components/visual/AriCore";
import { ThinkingFlow } from "@/components/visual/ThinkingFlow";
import { ProductShowcase } from "@/components/visual/ProductShowcase";
import { ArrowRight, ArrowDown, Sparkles } from "lucide-react";

const PROOF = ["Context-aware", "Cross-turn memory", "Evidence-backed"];

export default function Home() {
  return (
    <ProductShell activeRoute="home">
      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <AuroraBackground variant="hero" grid />
          <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-14 md:pt-24 pb-16 md:pb-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
              {/* Left: Copy */}
              <div className="space-y-6 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-[11px] font-mono tracking-wide animate-fade-in-up">
                  <Sparkles className="h-3 w-3" />
                  ADAPTIVE INTERVIEW INTELLIGENCE
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-zinc-50 leading-[1.06] animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                  An interview that
                  <br />
                  thinks{" "}
                  <span className="text-aurora">between your answers.</span>
                </h1>

                <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-md animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                  InterviewOS adapts every technical interview using candidate context,
                  live response signals, cross-turn memory, and evidence-backed evaluation.
                </p>

                {/* proof chips */}
                <div className="flex flex-wrap items-center gap-2 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                  {PROOF.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-2.5 py-1 text-[11px] text-zinc-400 backdrop-blur-sm">
                      <span className="h-1 w-1 rounded-full bg-cyan-400" />
                      {p}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-3 pt-2 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
                  <Link
                    href="/demo"
                    className="group relative overflow-hidden press px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 shadow-lg shadow-indigo-600/25"
                  >
                    <span className="beam" />
                    <span className="relative">Experience InterviewOS</span>
                    <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <a
                    href="#watch-it-adapt"
                    className="press px-5 py-3 rounded-xl border border-[var(--border)] hover:border-indigo-500/40 text-zinc-400 hover:text-zinc-200 text-sm transition-colors flex items-center gap-2 backdrop-blur-sm"
                  >
                    Watch It Adapt
                    <ArrowDown className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Right: Adaptive Intelligence Orbit */}
              <div className="relative animate-fade-in min-h-[360px] flex items-center justify-center" style={{ animationDelay: "300ms" }}>
                <AdaptiveCore />
              </div>
            </div>
          </div>
        </section>

        {/* ── How InterviewOS Thinks ── */}
        <section id="how-it-works" className="relative border-t border-[var(--border-subtle)] py-20 md:py-28 px-4 md:px-8 scroll-mt-20">
          <AuroraBackground variant="subtle" grid={false} />
          <div className="relative max-w-6xl mx-auto">
            <Reveal className="text-center space-y-3 mb-14">
              <div className="text-[11px] font-mono text-indigo-400 tracking-widest uppercase">
                How InterviewOS Thinks
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-zinc-50 tracking-tight">
                One continuous adaptive system.
              </h2>
              <p className="text-sm md:text-base text-zinc-500 max-w-lg mx-auto">
                Not four isolated steps — a connected intelligence pipeline that operates
                across every turn. Scroll to watch it move.
              </p>
            </Reveal>

            <ThinkingFlow />
          </div>
        </section>

        {/* ── Watch It Adapt ── */}
        <section id="watch-it-adapt" className="relative border-t border-[var(--border-subtle)] py-20 md:py-28 px-4 md:px-8 overflow-hidden scroll-mt-20">
          <AuroraBackground variant="panel" grid />
          <div className="relative max-w-5xl mx-auto">
            <Reveal className="text-center space-y-3 mb-14">
              <div className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">
                Watch It Adapt
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-zinc-50 tracking-tight">
                One signal reshapes the next question.
              </h2>
              <p className="text-sm md:text-base text-zinc-500 max-w-lg mx-auto">
                A live look at how a single candidate response routes through the adaptive pipeline.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-4 items-center">
              {/* Left: candidate answer */}
              <Reveal>
                <div className="gradient-border rounded-2xl p-6 bg-[var(--surface)]/80 backdrop-blur-sm edge-glow">
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-3">
                    Candidate Response
                  </div>
                  <p className="text-base text-zinc-100 italic leading-relaxed">
                    &ldquo;I would inspect the retrieved chunks before changing the model.&rdquo;
                  </p>
                </div>
              </Reveal>

              {/* Center: signal analysis */}
              <Reveal delay={120} className="flex lg:flex-col items-center justify-center gap-2 py-2">
                {[
                  { label: "Retrieval Reasoning", color: "text-indigo-300", dot: "#818cf8" },
                  { label: "Strong Signal", color: "text-cyan-300", dot: "#22d3ee" },
                  { label: "Deeper Probe", color: "text-violet-300", dot: "#a78bfa" },
                ].map((step, i) => (
                  <React.Fragment key={step.label}>
                    <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: step.dot, boxShadow: `0 0 8px ${step.dot}` }} />
                      <span className={`text-[11px] font-mono ${step.color}`}>{step.label}</span>
                    </div>
                    {i < 2 && <ArrowDown className="hidden lg:block h-4 w-4 text-zinc-700" />}
                    {i < 2 && <ArrowRight className="lg:hidden h-4 w-4 text-zinc-700" />}
                  </React.Fragment>
                ))}
              </Reveal>

              {/* Right: Ari's next question */}
              <Reveal delay={240}>
                <div className="rounded-2xl p-6 border border-cyan-500/20 bg-cyan-500/[0.04] backdrop-blur-sm relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <AriCore state="analyzing" size={26} />
                    <span className="text-[11px] font-mono text-zinc-500">Ari&apos;s Next Question</span>
                  </div>
                  <p className="text-base text-zinc-50 font-medium leading-relaxed min-h-[3.5rem]">
                    <TypeReveal text="How would you distinguish an embedding-quality issue from an index-recall problem?" />
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 text-[10px] font-mono text-cyan-300 uppercase tracking-wide">
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />
                    Evidence Ledger · reasoning captured
                  </div>
                </div>
              </Reveal>
            </div>

            <p className="text-center text-[11px] text-zinc-600 font-mono mt-10">
              Illustrative example showing how the adaptive pipeline responds to candidate signals.
            </p>
          </div>
        </section>

        {/* ── Product Showcase ── */}
        <section id="showcase" className="relative border-t border-[var(--border-subtle)] py-20 md:py-28 px-4 md:px-8 overflow-hidden scroll-mt-20">
          <AuroraBackground variant="subtle" grid={false} />
          <div className="relative max-w-6xl mx-auto">
            <Reveal className="text-center space-y-3 mb-14">
              <div className="text-[11px] font-mono text-violet-400 tracking-widest uppercase">
                One System, End to End
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-zinc-50 tracking-tight">
                Interview, evidence, and replay — connected.
              </h2>
              <p className="text-sm md:text-base text-zinc-500 max-w-lg mx-auto">
                Every surface is generated by the same engine, from the adaptive question to the evidence-backed report.
              </p>
            </Reveal>

            <Reveal>
              <ProductShowcase />
            </Reveal>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="relative border-t border-[var(--border-subtle)] py-20 md:py-24 px-4 md:px-8 overflow-hidden">
          <AuroraBackground variant="subtle" grid={false} />
          <Reveal className="relative max-w-2xl mx-auto text-center space-y-6">
            <AriCore state="ready" size={72} className="mx-auto" />
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-50">
              Ready to experience it?
            </h2>
            <p className="text-sm md:text-base text-zinc-500 max-w-md mx-auto">
              Start an adaptive technical interview with a sample profile. Every question, evaluation, and report is generated by the real engine.
            </p>
            <Link
              href="/demo"
              className="group relative overflow-hidden press inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/50 shadow-lg shadow-indigo-600/25"
            >
              <span className="beam" />
              <span className="relative">Experience InterviewOS</span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </section>
      </main>
    </ProductShell>
  );
}
