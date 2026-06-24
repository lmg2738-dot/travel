/** Vercel 서버리스(최대 60초) vs 로컬 개발 환경 설정 */
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
      openRouterTimeoutMs: 48_000,
      maxModelAttempts: 2,
      maxGenerationAttempts: 1,
      maxTokensCap: 4_000,
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

/** Vercel에서 모델 목록 API 호출 없이 바로 시도할 우선 모델 */
export const VERCEL_FAST_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-235b-a22b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];
