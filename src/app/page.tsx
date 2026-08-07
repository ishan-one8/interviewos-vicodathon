import Link from "next/link";
import { Terminal, Shield, Brain, Sparkles, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 px-8 py-4 flex items-center justify-between bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-zinc-100">
              Interview<span className="text-indigo-400">OS</span>
            </h1>
            <p className="text-xs text-zinc-400">Adaptive AI Technical Interviewer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/api/debug/planner?candidateId=CAND-003"
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
          >
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            GET /api/debug/planner
          </Link>
          <Link
            href="/api/debug/data"
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            GET /api/debug/data
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-medium w-fit mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Adaptive Interview Engine & Strategy Ready
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-50 max-w-2xl leading-tight mb-4">
          Real Technical Interviews, Powered by Adaptive AI
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mb-8 leading-relaxed">
          Not a static chatbot. InterviewOS evaluates candidate learning history, constructs dynamic skill hypotheses, enforces coverage guardrails, and plans tailored question strategies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <Terminal className="h-5 w-5 text-indigo-400 mb-3" />
            <h3 className="font-semibold text-sm text-zinc-200 mb-1">Official Data Engine</h3>
            <p className="text-xs text-zinc-400">31-day AI Cohort curriculum & 20 candidate profiles loaded with zero cost overhead.</p>
          </div>
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <Brain className="h-5 w-5 text-cyan-400 mb-3" />
            <h3 className="font-semibold text-sm text-zinc-200 mb-1">Skill Profiling & Probing</h3>
            <p className="text-xs text-zinc-400">Hypothesis-driven questions targeting struggle days, weak areas, and avoiding skipped topics.</p>
          </div>
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <Shield className="h-5 w-5 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-sm text-zinc-200 mb-1">State Machine Guardrails</h3>
            <p className="text-xs text-zinc-400">Strict curriculum coverage rules, turn limits, and deterministic state management.</p>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Adaptive Planner & Strategy Endpoint</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Inspect deterministic question strategy, difficulty policy, and coverage rescue mode.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/api/debug/planner?candidateId=CAND-003"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors inline-flex items-center gap-2"
            >
              Open /api/debug/planner
            </Link>
            <Link
              href="/api/debug/interview-state?candidateId=CAND-003"
              className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors inline-flex items-center gap-2"
            >
              Open /api/debug/interview-state
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
