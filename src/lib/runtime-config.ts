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
      openRouterTimeoutMs: 28_000,
      maxModelAttempts: 6,
      maxGenerationAttempts: 1,
      maxTokensCap: 2_000,
      useFastModelList: true,
      totalBudgetMs: 55_000,
    };
  }

  return {
    skipAihub: false,
    openRouterTimeoutMs: 45_000,
    maxModelAttempts: 8,
    maxGenerationAttempts: 2,
    maxTokensCap: 5_000,
    useFastModelList: false,
    totalBudgetMs: 150_000,
  };
}
