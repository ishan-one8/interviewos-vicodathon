"use client";

import React from "react";
import { CandidateProfile } from "@/types/interview";
import { InterviewerIdentity } from "./InterviewerIdentity";
import { Check, User, Briefcase, GraduationCap, ArrowRight, Shield } from "lucide-react";

interface CandidateSelectorProps {
  candidates: CandidateProfile[];
  selectedCandidateId: string | null;
  onSelectCandidate: (candidateId: string) => void;
  onStartInterview: () => void;
  isStarting: boolean;
}

export function CandidateSelector({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  onStartInterview,
  isStarting,
}: CandidateSelectorProps) {
  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-mono font-medium">
          <Shield className="h-3.5 w-3.5" />
          Technical Interview Lobby
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100">
          Select Candidate Profile
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          Choose a candidate profile to initialize a personalized adaptive technical evaluation with Ari.
        </p>
      </div>

      {/* Candidate Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((candidate) => {
          const isSelected = candidate.id === selectedCandidateId;
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelectCandidate(candidate.id)}
              className={`p-5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isSelected
                  ? "bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border-indigo-500/60 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/30"
                  : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80"
              }`}
            >
              {/* Checkmark selection badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700"
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-zinc-100 group-hover:text-white transition-colors">
                      {candidate.name}
                    </h3>
                    <p className="text-xs text-indigo-400 font-mono">{candidate.id}</p>
                  </div>
                </div>

                <div className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${
                  isSelected ? "bg-indigo-600 border-indigo-500 text-white" : "border-zinc-700 bg-zinc-800/50 text-transparent"
                }`}>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Candidate Info Details */}
              <div className="space-y-2 text-xs text-zinc-400 border-t border-zinc-800/60 pt-3 mt-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-300 font-medium">{candidate.jobRole}</span>
                  <span className="text-zinc-600">•</span>
                  <span>{candidate.yearsExperience} years exp</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{candidate.education}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lobby Interview Preview Box */}
      {selectedCandidate && (
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <InterviewerIdentity size="md" statusText="Senior AI Systems Interviewer • Active" />
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
              <span className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700/60">
                Format: 8–12 Questions
              </span>
              <span className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700/60">
                Curriculum: AI Engineering
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400 font-medium italic text-center sm:text-left">
              &quot;Your answers influence the questions that follow.&quot;
            </p>

            <button
              type="button"
              onClick={onStartInterview}
              disabled={isStarting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {isStarting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Initializing Session...</span>
                </>
              ) : (
                <>
                  <span>Begin Technical Interview</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
