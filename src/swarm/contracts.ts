import { z } from "zod";

export const agentRoleSchema = z.enum([
  "analyzer",
  "director",
  "rq_planner",
  "debater_a",
  "debater_b",
  "literature_researcher",
  "global_translator",
  "rq_validator",
  "academic_advisor",
  "main_writer",
]);

export type AgentRole = z.infer<typeof agentRoleSchema>;

const researchQuestionSchema = z.object({
  id: z.string().regex(/^RQ[1-9][0-9]*$/),
  question: z.string().min(20).max(500),
  variables: z.array(z.string().min(2)).min(2).max(8),
  population: z.string().min(2).max(200),
  scope: z.string().min(5).max(400),
});

export const proposalAnalysisSchema = z.object({
  summary: z.string().min(40),
  thesisDirection: z.string().min(20),
  keyConcepts: z.array(z.string().min(2)).min(3).max(12),
  methodologyHints: z.array(z.string().min(3)).min(1).max(8),
  constraints: z.array(z.string().min(3)).max(10),
});

export const directionReviewSchema = z.object({
  academicValue: z.string().min(30),
  feasibility: z.string().min(20),
  logicalRisks: z.array(z.string().min(5)).min(1).max(10),
  recommendations: z.array(z.string().min(5)).min(1).max(10),
  verdict: z.enum(["proceed", "revise", "halt"]),
});

export const researchQuestionPlanSchema = z.object({
  researchQuestions: z.array(researchQuestionSchema).min(1).max(5),
  rationale: z.string().min(30),
});

export const debateTurnSchema = z
  .object({
    round: z.number().int().min(1).max(3),
    speaker: z.enum(["debater_a", "debater_b"]),
    stance: z.enum(["support", "critique"]),
    claims: z.array(z.string().min(5)).min(1).max(6),
    response: z.string().min(20).max(6000),
  })
  .superRefine((turn, context) => {
    const valid =
      (turn.speaker === "debater_a" && turn.stance === "support") ||
      (turn.speaker === "debater_b" && turn.stance === "critique");
    if (!valid) {
      context.addIssue({ code: "custom", message: "debate speaker and stance do not match" });
    }
  });

export const literaturePlanSchema = z.object({
  searchQueries: z.array(z.string().min(5)).min(2).max(8),
  inclusionCriteria: z.array(z.string().min(5)).min(2).max(8),
  exclusionCriteria: z.array(z.string().min(5)).min(1).max(8),
  synthesisFocus: z.string().min(20),
});

export const translationAnalysisSchema = z.object({
  translations: z
    .array(
      z.object({
        paperKey: z.string().min(1),
        koreanTitle: z.string().min(3),
        koreanSummary: z.string().min(30),
        keyFindings: z.array(z.string().min(5)).min(1).max(8),
      }),
    )
    .max(30),
  crossStudyInsights: z.array(z.string().min(10)).min(1).max(12),
});

export const rqValidationSchema = z.object({
  revisedQuestions: z.array(researchQuestionSchema).min(1).max(5),
  changeLog: z.array(z.string().min(8)).min(1).max(12),
  validityAssessment: z.string().min(30),
});

export const advisorFeedbackSchema = z.object({
  rubric: z.object({
    novelty: z.number().min(0).max(5),
    rigor: z.number().min(0).max(5),
    feasibility: z.number().min(0).max(5),
    coherence: z.number().min(0).max(5),
  }),
  summary: z.string().min(40),
  requiredRevisions: z.array(z.string().min(8)).min(1).max(12),
  recommendation: z.enum(["approve", "minor_revision", "major_revision"]),
});

export const finalPaperSchema = z.object({
  title: z.string().min(10).max(500),
  abstract: z.string().min(80).max(4000),
  keywords: z.array(z.string().min(2)).min(3).max(10),
  markdown: z.string().min(200),
  citations: z.array(z.string().min(5)).min(1),
});

export type ProposalAnalysis = z.infer<typeof proposalAnalysisSchema>;
export type DirectionReview = z.infer<typeof directionReviewSchema>;
export type ResearchQuestionPlan = z.infer<typeof researchQuestionPlanSchema>;
export type DebateTurn = z.infer<typeof debateTurnSchema>;
export type LiteraturePlan = z.infer<typeof literaturePlanSchema>;
export type TranslationAnalysis = z.infer<typeof translationAnalysisSchema>;
export type RqValidation = z.infer<typeof rqValidationSchema>;
export type AdvisorFeedback = z.infer<typeof advisorFeedbackSchema>;
export type FinalPaper = z.infer<typeof finalPaperSchema>;
