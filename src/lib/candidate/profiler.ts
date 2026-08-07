import {
  CandidateProfile,
  CurriculumTopic,
  SkillHypothesis,
  CandidateIntelligenceReport,
  SeniorityTier,
  DifficultyLevel,
  InterviewPriority,
} from "@/types/interview";

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

export function determineSeniorityTier(yearsExperience: number, jobRole: string): SeniorityTier {
  const role = normalizeText(jobRole);
  if (yearsExperience >= 15 || role.includes("principal") || role.includes("distinguished") || role.includes("architect")) {
    return "principal";
  }
  if (yearsExperience >= 7 || role.includes("senior") || role.includes("lead")) {
    return "senior";
  }
  if (yearsExperience >= 3 || role.includes("engineer")) {
    return "mid";
  }
  return "junior";
}

export function getStartingDifficulty(tier: SeniorityTier): DifficultyLevel {
  switch (tier) {
    case "principal":
      return "architecture";
    case "senior":
      return "advanced";
    case "mid":
      return "intermediate";
    case "junior":
    default:
      return "foundation";
  }
}

function isTopicSkipped(candidate: CandidateProfile, topic: CurriculumTopic): boolean {
  const topicTitleNorm = normalizeText(topic.topic);

  // Check skippedTopics list
  const inSkippedList = candidate.skippedTopics.some((skipped) => {
    const skippedNorm = normalizeText(skipped);
    return topicTitleNorm.includes(skippedNorm) || skippedNorm.includes(topicTitleNorm);
  });

  if (inSkippedList) return true;

  // Check explicit candidate.missions
  const mission = candidate.missions.find((m) => m.day === topic.day);
  return Boolean(mission && mission.skipped);
}

function getTopicAttempts(candidate: CandidateProfile, topic: CurriculumTopic): number {
  // Check direct mission array by day
  const mission = candidate.missions.find((m) => m.day === topic.day);
  if (mission && typeof mission.attempts === "number") {
    return mission.attempts;
  }

  // Check attempts object map
  if (candidate.attempts) {
    if (typeof candidate.attempts[topic.topic] === "number") {
      return candidate.attempts[topic.topic];
    }
    if (typeof candidate.attempts[`day-${topic.day}`] === "number") {
      return candidate.attempts[`day-${topic.day}`];
    }
  }

  return 0;
}

export function buildSkillHypothesis(
  candidate: CandidateProfile,
  topic: CurriculumTopic,
  seniorityTier: SeniorityTier
): SkillHypothesis {
  const completed = candidate.completedDays.includes(topic.day);
  const skipped = isTopicSkipped(candidate, topic);
  const attemptsCount = getTopicAttempts(candidate, topic);
  const evidence: string[] = [];

  // Rule 1: Skipped Topic (Fair Treatment)
  if (skipped) {
    evidence.push(
      `Candidate explicitly skipped Day ${topic.day} (${topic.topic}). Marked to avoid asking unless candidate initiates.`
    );
    return {
      topic: topic.topic,
      curriculumDay: topic.day,
      moduleTitle: topic.module,
      exposure: "low",
      estimatedStrength: 0.2,
      confidence: 0.85,
      interviewPriority: "avoid",
      recommendedDifficulty: "foundation",
      isSkipped: true,
      attemptsCount: 0,
      evidence,
    };
  }

  // Rule 2: Completed Topic
  if (completed) {
    let estimatedStrength = 0.65;
    let confidence = 0.65;
    let exposure: SkillHypothesis["exposure"] = "medium";
    let interviewPriority: InterviewPriority = "medium";
    let isStruggleTopic = false;

    evidence.push(`Completed curriculum Day ${topic.day}: ${topic.topic} (${topic.module}).`);

    // Attempts scoring credit & penalties
    if (attemptsCount === 1) {
      estimatedStrength += 0.15;
      confidence += 0.1;
      evidence.push(`Passed mission on the 1st attempt (demonstrates immediate comprehension).`);
    } else if (attemptsCount === 2) {
      estimatedStrength += 0.05;
      confidence += 0.05;
      evidence.push(`Passed mission on 2 attempts.`);
    } else if (attemptsCount >= 3) {
      const penalty = Math.min((attemptsCount - 1) * 0.05, 0.2);
      estimatedStrength -= penalty;
      confidence += 0.15;
      interviewPriority = "high"; // High priority to verify struggle topic
      isStruggleTopic = true;
      evidence.push(
        `Required ${attemptsCount} attempts to pass mission. Topic tagged as high-priority for technical verification.`
      );
    } else {
      evidence.push(`Curriculum day registered as completed.`);
    }

    // Seniority bonus for completed topics
    if (seniorityTier === "senior" || seniorityTier === "principal") {
      estimatedStrength += 0.05;
    }

    // Explicit learning signals
    const relatedSignals = candidate.learningSignals.filter((s) => s.topicId === topic.id);
    if (relatedSignals.length > 0) {
      const avgSignalStrength =
        relatedSignals.reduce((sum, s) => sum + (s.strength ?? 0.5), 0) / relatedSignals.length;
      estimatedStrength = estimatedStrength * 0.5 + avgSignalStrength * 0.5;
      confidence += 0.1;
      relatedSignals.forEach((s) => evidence.push(s.signal));
    }

    estimatedStrength = clamp(estimatedStrength);
    confidence = clamp(confidence);

    let recommendedDifficulty: DifficultyLevel;
    if (isStruggleTopic) {
      recommendedDifficulty = "debugging";
      exposure = "medium";
    } else if (estimatedStrength >= 0.78) {
      exposure = "high";
      recommendedDifficulty =
        seniorityTier === "principal" || seniorityTier === "senior"
          ? "architecture"
          : "advanced";
    } else if (estimatedStrength >= 0.55) {
      exposure = "medium";
      recommendedDifficulty = "intermediate";
    } else {
      exposure = "low";
      recommendedDifficulty = "foundation";
    }

    return {
      topic: topic.topic,
      curriculumDay: topic.day,
      moduleTitle: topic.module,
      exposure,
      estimatedStrength: Number(estimatedStrength.toFixed(2)),
      confidence: Number(confidence.toFixed(2)),
      interviewPriority,
      recommendedDifficulty,
      isSkipped: false,
      attemptsCount,
      evidence,
    };
  }

  // Rule 3: Not Completed & Not Skipped
  evidence.push(`No mission or completion record found for Day ${topic.day} (${topic.topic}).`);
  return {
    topic: topic.topic,
    curriculumDay: topic.day,
    moduleTitle: topic.module,
    exposure: "none",
    estimatedStrength: 0.25,
    confidence: 0.4,
    interviewPriority: "low",
    recommendedDifficulty: "foundation",
    isSkipped: false,
    attemptsCount: 0,
    evidence,
  };
}

export function profileCandidate(
  candidate: CandidateProfile,
  curriculum: CurriculumTopic[]
): CandidateIntelligenceReport {
  const seniorityTier = determineSeniorityTier(
    candidate.yearsExperience,
    candidate.jobRole
  );
  const startingDifficulty = getStartingDifficulty(seniorityTier);

  // Build skill map deterministically
  const skillMap = curriculum.map((topic) =>
    buildSkillHypothesis(candidate, topic, seniorityTier)
  );

  // Aggregate topics
  const strongestTopics = skillMap
    .filter((s) => !s.isSkipped && s.estimatedStrength >= 0.7)
    .sort((a, b) => b.estimatedStrength - a.estimatedStrength);

  const topicsToVerify = skillMap
    .filter(
      (s) => !s.isSkipped && (s.attemptsCount >= 3 || (s.estimatedStrength < 0.65 && s.exposure !== "none"))
    )
    .sort((a, b) => b.attemptsCount - a.attemptsCount || a.estimatedStrength - b.estimatedStrength);

  const lowExposureTopics = skillMap
    .filter((s) => !s.isSkipped && (s.exposure === "none" || s.exposure === "low"))
    .sort((a, b) => a.curriculumDay - b.curriculumDay);

  const skippedTopics = skillMap.filter((s) => s.isSkipped);

  // Curate 3-5 suggested starting topics
  const suggestedSet = new Set<SkillHypothesis>();

  // 1. Pick top verification topic if available
  if (topicsToVerify.length > 0) {
    suggestedSet.add(topicsToVerify[0]);
  }

  // 2. Pick top strength topic if available
  if (strongestTopics.length > 0) {
    suggestedSet.add(strongestTopics[0]);
  }

  // 3. Pick core curriculum milestone topics (e.g. Day 10, Day 12, Day 22, Day 23)
  const coreTargetDays = [10, 12, 22, 23, 16, 7];
  for (const day of coreTargetDays) {
    const topic = skillMap.find((s) => s.curriculumDay === day && !s.isSkipped);
    if (topic && suggestedSet.size < 5) {
      suggestedSet.add(topic);
    }
  }

  // Fill up to 3..5 topics if still needed
  for (const item of skillMap) {
    if (!item.isSkipped && suggestedSet.size < 4) {
      suggestedSet.add(item);
    }
  }

  const suggestedStartingTopics = Array.from(suggestedSet).slice(0, 5);

  // Compute overall candidate average skill based on completed topics (or active topics if none completed)
  const completedTopics = skillMap.filter((s) => !s.isSkipped && s.exposure !== "none");
  const activeForAverage = completedTopics.length > 0 ? completedTopics : skillMap.filter((s) => !s.isSkipped);

  const avgStrength =
    activeForAverage.length > 0
      ? activeForAverage.reduce((sum, s) => sum + s.estimatedStrength, 0) / activeForAverage.length
      : 0.5;

  const avgConfidence =
    skillMap.reduce((sum, s) => sum + s.confidence, 0) / skillMap.length;

  const summaryNotes: string[] = [
    `Candidate evaluated as ${seniorityTier.toUpperCase()} tier (${candidate.yearsExperience} yrs experience as ${candidate.jobRole}).`,
    `Completed ${candidate.completedDays.length} of ${curriculum.length} curriculum days.`,
    `Identified ${strongestTopics.length} high-confidence mastery topics and ${topicsToVerify.length} topics requiring technical verification.`,
  ];

  if (skippedTopics.length > 0) {
    summaryNotes.push(
      `Candidate skipped ${skippedTopics.length} topic(s) (${skippedTopics.map((s) => s.topic).join(", ")}). Fairly excluded from penalty.`
    );
  }

  return {
    candidate,
    skillMap,
    overallSkillEstimate: Number(avgStrength.toFixed(2)),
    overallConfidence: Number(avgConfidence.toFixed(2)),
    seniorityTier,
    recommendedStartingDifficulty: startingDifficulty,
    strongestTopics,
    topicsToVerify,
    lowExposureTopics,
    skippedTopics,
    suggestedStartingTopics,
    summaryNotes,
  };
}