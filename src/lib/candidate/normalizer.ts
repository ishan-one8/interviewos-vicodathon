import {
  CandidateProfile,
  CandidateMission,
  RawCandidateDatasetSchema,
  RawCandidateSchema,
  RawCandidate,
  LearningSignal,
} from "@/types/interview";

export function normalizeCandidate(rawCandidate: unknown): CandidateProfile {
  const parseResult = RawCandidateSchema.safeParse(rawCandidate);
  const data: RawCandidate = parseResult.success
    ? parseResult.data
    : (rawCandidate as RawCandidate);

  const member = data.member || {
    id: "UNKNOWN",
    name: "Unknown Candidate",
    jobRole: "Software Engineer",
    yearsExperience: 0,
    education: "N/A",
    status: "UNKNOWN",
  };

  const rawMissions = Array.isArray(data.missions) ? data.missions : [];
  const missions: CandidateMission[] = rawMissions.map((m) => ({
    day: m.day,
    title: m.title || `Day ${m.day}`,
    passed: Boolean(m.passed),
    skipped: Boolean(m.skipped),
    attempts: typeof m.attempts === "number" ? m.attempts : 0,
  }));

  const completedDays = missions
    .filter((m) => m.passed)
    .map((m) => m.day);

  const completedMissions = missions
    .filter((m) => m.passed)
    .map((m) => m.title);

  const skippedTopics = missions
    .filter((m) => m.skipped)
    .map((m) => m.title);

  const attempts: Record<string, number> = {};
  missions.forEach((m) => {
    if (m.attempts > 0) {
      attempts[m.title] = m.attempts;
      attempts[`day-${m.day}`] = m.attempts;
    }
  });

  const rawSignals = data.signals || {
    commitDays: 0,
    missionsCompleted: completedDays.length,
    missionsFirstTry: missions.filter((m) => m.passed && m.attempts === 1).length,
  };

  const learningSignals: LearningSignal[] = [];
  missions.forEach((m) => {
    if (m.skipped) {
      learningSignals.push({
        topicId: `day-${m.day}`,
        signal: `Candidate skipped mission "${m.title}" on day ${m.day}`,
        strength: 0.1,
      });
    } else if (m.attempts > 3) {
      learningSignals.push({
        topicId: `day-${m.day}`,
        signal: `Candidate struggled on "${m.title}" requiring ${m.attempts} attempts`,
        strength: 0.4,
      });
    } else if (m.passed && m.attempts === 1) {
      learningSignals.push({
        topicId: `day-${m.day}`,
        signal: `Candidate passed "${m.title}" on the first attempt`,
        strength: 0.9,
      });
    }
  });

  return {
    id: member.id,
    name: member.name,
    jobRole: member.jobRole,
    yearsExperience: member.yearsExperience,
    education: member.education,
    status: member.status,
    completedDays,
    completedMissions,
    attempts,
    skippedTopics,
    learningSignals,
    signals: {
      commitDays: rawSignals.commitDays,
      missionsCompleted: rawSignals.missionsCompleted,
      missionsFirstTry: rawSignals.missionsFirstTry,
    },
    missions,
  };
}

export function normalizeCandidateDataset(raw: unknown): {
  candidates: CandidateProfile[];
  errors: string[];
} {
  const parseResult = RawCandidateDatasetSchema.safeParse(raw);
  const errors: string[] = [];

  if (!parseResult.success) {
    errors.push(`Candidate dataset schema warning: ${parseResult.error.message}`);
  }

  const rawList = parseResult.success
    ? parseResult.data.candidates
    : (raw as { candidates?: unknown[] })?.candidates || [];

  const candidates = rawList.map((item) => normalizeCandidate(item));

  return {
    candidates,
    errors,
  };
}
