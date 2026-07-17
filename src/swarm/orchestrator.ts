import type { ZodType } from "zod";

import { normalizeDoi, type NormalizedPaper } from "@/lib/research/normalize";
import { encryptText } from "@/lib/security/envelope";

import { AGENT_DEFINITIONS } from "./agents";
import {
  advisorFeedbackSchema,
  type AgentRole,
  type DebateTurn,
  debateTurnSchema,
  directionReviewSchema,
  finalPaperSchema,
  literaturePlanSchema,
  proposalAnalysisSchema,
  researchQuestionPlanSchema,
  rqValidationSchema,
  translationAnalysisSchema,
} from "./contracts";
import type { ModelGateway, ResearchGateway, SwarmRepository } from "./ports";
import { withRetry } from "./retry";
import { STAGE_PROGRESS, STAGE_TASKS } from "./stages";
import { MAIN_WRITER_QUALITY_RULES } from "./writing-spec";

export type SwarmDependencies = {
  repository: SwarmRepository;
  model: ModelGateway;
  research: ResearchGateway;
  encryptionKey: string;
};

class RunCancelledError extends Error {
  retryable = false;
}

async function runAgent<T>(
  runId: string,
  role: AgentRole,
  input: unknown,
  schema: ZodType<T>,
  dependencies: SwarmDependencies,
): Promise<T> {
  const { repository, model } = dependencies;
  if (await repository.isCancelled(runId))
    throw new RunCancelledError("Pipeline run was cancelled");
  const definition = AGENT_DEFINITIONS[role];
  await repository.setRunState(runId, {
    status: "running",
    currentStage: role,
    progress: STAGE_PROGRESS[role],
  });
  await repository.setAgentState(
    runId,
    role,
    definition.defaultState,
    STAGE_PROGRESS[role],
    STAGE_TASKS[role],
  );
  await repository.appendEvent(runId, {
    role,
    state: definition.defaultState,
    message: `${definition.displayName} 단계가 시작되었습니다.`,
    metadata: { progress: STAGE_PROGRESS[role] },
  });
  const output = await withRetry(
    () =>
      model.run({
        role,
        systemPrompt:
          role === "main_writer"
            ? `${definition.systemPrompt}\n\n${MAIN_WRITER_QUALITY_RULES}`
            : definition.systemPrompt,
        input,
        outputSchema: schema,
      }),
    { attempts: 3, baseDelayMs: 250 },
  );
  await repository.setAgentState(runId, role, "completed", 100, "단계 완료");
  await repository.appendEvent(runId, {
    role,
    state: "completed",
    message: `${definition.displayName} 단계가 완료되었습니다.`,
    metadata: { progress: 100 },
  });
  return output;
}

function paperKey(paper: NormalizedPaper): string {
  return normalizeDoi(paper.doi) ?? paper.url ?? paper.title;
}

export async function runSwarm(
  runId: string,
  dependencies: SwarmDependencies,
): Promise<void> {
  const { repository, research, encryptionKey } = dependencies;
  const run = await repository.loadRun(runId);
  let currentRole: AgentRole = "analyzer";
  try {
    const analysis = await runAgent(
      runId,
      (currentRole = "analyzer"),
      { proposalTitle: run.title, proposal: run.proposalText },
      proposalAnalysisSchema,
      dependencies,
    );
    const direction = await runAgent(
      runId,
      (currentRole = "director"),
      { proposalTitle: run.title, analysis },
      directionReviewSchema,
      dependencies,
    );
    const initialRq = await runAgent(
      runId,
      (currentRole = "rq_planner"),
      { analysis, direction },
      researchQuestionPlanSchema,
      dependencies,
    );
    const initialRqId = await repository.saveRqRecord(runId, {
      version: 1,
      stage: "initial",
      questions: initialRq.researchQuestions,
      rationale: initialRq.rationale,
    });

    const debateHistory: DebateTurn[] = [];
    for (let round = 1; round <= 3; round += 1) {
      const support: DebateTurn = await runAgent(
        runId,
        (currentRole = "debater_a"),
        {
          round,
          researchQuestions: initialRq.researchQuestions,
          history: debateHistory,
        },
        debateTurnSchema,
        dependencies,
      );
      if (support.round !== round || support.speaker !== "debater_a") {
        throw Object.assign(
          new Error("Debater A returned an invalid round identity"),
          { retryable: false },
        );
      }
      debateHistory.push(support);
      await repository.saveDebateTurn(runId, support, round * 2 - 1);

      const critique: DebateTurn = await runAgent(
        runId,
        (currentRole = "debater_b"),
        {
          round,
          researchQuestions: initialRq.researchQuestions,
          history: debateHistory,
        },
        debateTurnSchema,
        dependencies,
      );
      if (critique.round !== round || critique.speaker !== "debater_b") {
        throw Object.assign(
          new Error("Debater B returned an invalid round identity"),
          { retryable: false },
        );
      }
      debateHistory.push(critique);
      await repository.saveDebateTurn(runId, critique, round * 2);
    }

    const literaturePlan = await runAgent(
      runId,
      (currentRole = "literature_researcher"),
      { researchQuestions: initialRq.researchQuestions, debateHistory },
      literaturePlanSchema,
      dependencies,
    );
    const papers = await withRetry(
      () => research.search(literaturePlan.searchQueries),
      {
        attempts: 2,
        baseDelayMs: 500,
      },
    );
    await repository.appendEvent(runId, {
      role: "literature_researcher",
      state: "researching",
      message: `검증 가능한 문헌 ${papers.length}건을 수집했습니다.`,
      metadata: { paperCount: papers.length },
    });

    const translation = await runAgent(
      runId,
      (currentRole = "global_translator"),
      {
        papers: papers.map((paper) => ({
          paperKey: paperKey(paper),
          title: paper.title,
          abstract: paper.abstractSummary,
          journal: paper.journal,
        })),
      },
      translationAnalysisSchema,
      dependencies,
    );
    const translations = new Map(
      translation.translations.map((item) => [
        item.paperKey,
        item.koreanSummary,
      ]),
    );
    const translatedPapers = papers.map((paper) => ({
      ...paper,
      translatedSummary: translations.get(paperKey(paper)),
    }));
    await repository.saveResearchPapers(runId, translatedPapers);

    const validatedRq = await runAgent(
      runId,
      (currentRole = "rq_validator"),
      {
        initialQuestions: initialRq.researchQuestions,
        debateHistory,
        papers: translatedPapers,
        translationInsights: translation.crossStudyInsights,
      },
      rqValidationSchema,
      dependencies,
    );
    await repository.saveRqRecord(runId, {
      version: 2,
      stage: "validated",
      questions: validatedRq.revisedQuestions,
      rationale: validatedRq.validityAssessment,
      parentId: initialRqId,
    });

    const advisor = await runAgent(
      runId,
      (currentRole = "academic_advisor"),
      {
        analysis,
        direction,
        validatedRq,
        debateHistory,
        papers: translatedPapers,
      },
      advisorFeedbackSchema,
      dependencies,
    );
    await repository.saveAdvisorFeedback(runId, advisor);

    const finalPaper = await runAgent(
      runId,
      (currentRole = "main_writer"),
      {
        proposalTitle: run.title,
        analysis,
        validatedRq,
        advisor,
        papers: translatedPapers,
        writingBrief: run.writingBrief ?? "",
      },
      finalPaperSchema,
      dependencies,
    );
    const envelope = encryptText(
      finalPaper.markdown,
      encryptionKey,
      `${run.ownerId}:${run.proposalId}:final:1`,
    );
    await repository.saveFinalPaper(runId, {
      version: 1,
      title: finalPaper.title,
      abstract: finalPaper.abstract,
      envelope,
      status: "final",
    });
    await repository.setRunState(runId, {
      status: "completed",
      progress: 100,
      errorMessage: null,
    });
  } catch (error) {
    const cancelled = error instanceof RunCancelledError;
    await repository.setAgentState(
      runId,
      currentRole,
      cancelled ? "idle" : "error",
      STAGE_PROGRESS[currentRole],
      cancelled ? "사용자에 의해 취소됨" : "단계 실행 실패",
    );
    await repository.appendEvent(runId, {
      role: currentRole,
      state: cancelled ? "idle" : "error",
      message: cancelled
        ? "파이프라인 실행이 취소되었습니다."
        : `${AGENT_DEFINITIONS[currentRole].displayName} 단계가 실패했습니다.`,
      metadata: {
        errorType: error instanceof Error ? error.name : "UnknownError",
      },
    });
    await repository.setRunState(runId, {
      status: cancelled ? "cancelled" : "failed",
      errorMessage: cancelled
        ? null
        : error instanceof Error
          ? error.message.slice(0, 1000)
          : "Unknown error",
    });
    if (!cancelled) throw error;
  }
}
