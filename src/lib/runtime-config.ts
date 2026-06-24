/** Vercel 서버리스(최대 60초) vs 로컬 개발 환경 설정 */
import { PREFERRED_FREE_MODEL_IDS } from "@/lib/openrouter/models";

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

export interface GenerateRuntimeConfig {
  skipAihub: boolean;
  openRouterTimeoutMs: number;
  maxModelAttempts: number;
  maxGenerationAttempts: number;
  maxTokensCap: number;
  useFastModelList: boolean;
  totalBudgetMs: number;
}

export function getGenerateRuntimeConfig(): GenerateRuntimeConfig {
  if (isVercelRuntime()) {
    return {
      skipAihub: true,
      openRouterTimeoutMs: 45_000,
      maxModelAttempts: 3,
      maxGenerationAttempts: 2,
      maxTokensCap: 3_500,
      useFastModelList: true,
      totalBudgetMs: 55_000,
    };
  }

  return {
    skipAihub: false,
    openRouterTimeoutMs: 55_000,
    maxModelAttempts: 6,
    maxGenerationAttempts: 3,
    maxTokensCap: 8_192,
    useFastModelList: false,
    totalBudgetMs: 120_000,
  };
}

export const VERCEL_FAST_MODELS = PREFERRED_FREE_MODEL_IDS;
