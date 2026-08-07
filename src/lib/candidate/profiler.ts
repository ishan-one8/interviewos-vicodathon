import {
  CandidateProfile,
  CurriculumTopic,
  SkillHypothesis,
} from "@/types/interview";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function getRelatedAttempts(
  candidate: CandidateProfile,
  topic: CurriculumTopic
) {
  const keywords = [
    topic.topic,
    topic.module,
    ...topic.learningObjectives,
  ]
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4);

  const matches = Object.entries(candidate.attempts).filter(
    ([mission]) => {
      const normalizedMission = normalize(mission);

      return keywords.some((keyword) =>
        normalizedMission.includes(keyword)
      );
    }
  );

  if (matches.length === 0) {
    return null;
  }

  const totalAttempts = matches.reduce(
    (sum, [, attempts]) => sum + attempts,
    0
  );

  return Math.round(totalAttempts / matches.length);
}

function isTopicSkipped(
  candidate: CandidateProfile,
  topic: CurriculumTopic
) {
  const topicText = normalize(
    `${topic.topic} ${topic.module}`
  );

  return candidate.skippedTopics.some((skipped) => {
    const normalizedSkipped = normalize(skipped);

    return (
      topicText.includes(normalizedSkipped) ||
      normalizedSkipped.includes(normalize(topic.topic))
    );
  });
}

export function buildSkillMap(
  candidate: CandidateProfile,
  curriculum: CurriculumTopic[]
): SkillHypothesis[] {
  return curriculum.map((topic) => {
    const completed = candidate.completedDays.includes(
      topic.day
    );

    const skipped = isTopicSkipped(candidate, topic);

    const relatedAttempts = getRelatedAttempts(
      candidate,
      topic
    );

    const relatedSignals =
      candidate.learningSignals.filter(
        (signal) => signal.topicId === topic.id
      );

    const averageSignalStrength =
      relatedSignals.length > 0
        ? relatedSignals.reduce(
            (sum, signal) =>
              sum + (signal.strength ?? 0.5),
            0
          ) / relatedSignals.length
        : null;

    let estimatedStrength = 0.25;

    let confidence = 0.35;

    let exposure: SkillHypothesis["exposure"] =
      "none";

    const evidence: string[] = [];

    // Candidate explicitly skipped the topic
    if (skipped) {
      estimatedStrength = 0.2;
      confidence = 0.9;
      exposure = "low";

      evidence.push(
        `Candidate skipped ${topic.topic}. This topic should not be treated as mastered knowledge.`
      );

      return {
        topic: topic.topic,
        curriculumDay: topic.day,
        exposure,
        estimatedStrength,
        confidence,
        evidence,
      };
    }

    // Candidate completed the curriculum day
    if (completed) {
      estimatedStrength = 0.65;
      confidence = 0.7;
      exposure = "medium";

      evidence.push(
        `Candidate completed curriculum day ${topic.day}: ${topic.topic}.`
      );
    } else {
      evidence.push(
        `No confirmed completion for curriculum day ${topic.day}.`
      );
    }

    // Attempts are useful evidence
    if (relatedAttempts !== null) {
      if (relatedAttempts === 1) {
        estimatedStrength += 0.08;

        evidence.push(
          `Related mission appears to have been completed on the first attempt.`
        );
      }

      if (relatedAttempts === 2) {
        estimatedStrength -= 0.04;

        evidence.push(
          `Related mission required approximately two attempts.`
        );
      }

      if (relatedAttempts >= 3) {
        const penalty = Math.min(
          (relatedAttempts - 1) * 0.07,
          0.25
        );

        estimatedStrength -= penalty;

        evidence.push(
          `Related mission required approximately ${relatedAttempts} attempts, so understanding should be verified during the interview.`
        );
      }

      confidence += 0.08;
    }

    // Explicit learning signals get stronger weight
    if (averageSignalStrength !== null) {
      estimatedStrength =
        estimatedStrength * 0.45 +
        averageSignalStrength * 0.55;

      confidence += 0.15;

      relatedSignals.forEach((signal) => {
        evidence.push(signal.signal);
      });
    }

    estimatedStrength = clamp(estimatedStrength);

    confidence = clamp(confidence);

    if (estimatedStrength >= 0.8) {
      exposure = "high";
    } else if (estimatedStrength >= 0.55) {
      exposure = "medium";
    } else if (estimatedStrength > 0.2) {
      exposure = "low";
    } else {
      exposure = "none";
    }

    return {
      topic: topic.topic,
      curriculumDay: topic.day,
      exposure,
      estimatedStrength,
      confidence,
      evidence,
    };
  });
}