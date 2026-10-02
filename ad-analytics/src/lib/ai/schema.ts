import { z } from "zod";

/** AI 응답 형식 (문제 → 가능한 원인 → 확인해야 할 사항 → 권장 액션) */
export const InsightItemSchema = z.object({
  id: z.string(),
  severity: z.enum(["critical", "warning", "positive"]),
  title: z.string(),
  problem: z.string(),
  possibleCauses: z.array(z.string()),
  checks: z.array(z.string()),
  recommendedActions: z.array(z.object({ priority: z.number().int(), action: z.string() })),
  relatedAlertId: z.string().optional(),
});

export const AIOutputSchema = z.object({
  summary: z.string(),
  issues: z.array(InsightItemSchema),
  recommendedActions: z.array(z.object({ priority: z.number().int(), action: z.string() })),
});

export type AIOutput = z.infer<typeof AIOutputSchema>;
