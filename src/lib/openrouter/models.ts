import type { OpenRouterModel } from "./types";

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * OpenRouter API로 검증된 무료 모델 (2026-06 기준)
 * 빠른·가벼운 모델 우선 → JSON 일정 생성에 적합한 순
 */
export const VERIFIED_FALLBACK_MODEL_IDS = [
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "openrouter/free",
];

/** Vercel: 정적 fallback (라이브 API 실패 시) */
export const VERCEL_STATIC_MODEL_IDS = [...VERIFIED_FALLBACK_MODEL_IDS];

/** @deprecated VERCEL_STATIC_MODEL_IDS 사용 */
export const VERCEL_VERIFIED_MODEL_IDS = VERCEL_STATIC_MODEL_IDS;

/** JSON 일정 생성 우선순위 (live 목록과 교차 검증됨) */
export const PREFERRED_FREE_MODEL_IDS = [...VERIFIED_FALLBACK_MODEL_IDS];

const EXCLUDED_MODEL_PATTERNS = [
  /lyria/i,
  /clip-preview/i,
  /audio/i,
  /whisper/i,
  /dall-?e/i,
  /stable-?diffusion/i,
  /vision-only/i,
  /embedding/i,
  /rerank/i,
  /nemotron/i,
  /owl-alpha/i,
  /code/i,
  /safety/i,
  /laguna/i,
  /fugu/i,
  /:vl$/i,
  /vl:free/i,
];

const unavailableModels = new Set<string>();
let lastSuccessfulModelId: string | null = null;

let cachedFreeModels: OpenRouterModel[] | null = null;
let cacheExpiresAt = 0;

function isFreeModel(model: OpenRouterModel): boolean {
  const prompt = parseFloat(model.pricing?.prompt ?? "1");
  const completion = parseFloat(model.pricing?.completion ?? "1");
  return prompt === 0 && completion === 0;
}

function supportsChatCompletion(model: OpenRouterModel): boolean {
  const modality = model.architecture?.modality ?? "text->text";
  if (!modality.includes("text")) return false;
  if (EXCLUDED_MODEL_PATTERNS.some((pattern) => pattern.test(model.id))) {
    return false;
  }
  return true;
}

function preferredRank(modelId: string): number {
  const index = PREFERRED_FREE_MODEL_IDS.indexOf(modelId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function sortFreeModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return [...models].sort((a, b) => {
    const prefDiff = preferredRank(a.id) - preferredRank(b.id);
    if (prefDiff !== 0) return prefDiff;

    const ctxDiff = (b.context_length ?? 0) - (a.context_length ?? 0);
    if (ctxDiff !== 0) return ctxDiff;
    return a.id.localeCompare(b.id);
  });
}

export async function fetchFreeModels(): Promise<OpenRouterModel[]> {
  const now = Date.now();
  if (!isVercelRuntime() && cachedFreeModels && now < cacheExpiresAt) {
    return cachedFreeModels;
  }

  const response = await fetch(OPENROUTER_MODELS_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(isVercelRuntime() ? 6_000 : 10_000),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter 모델 목록 조회 실패: HTTP ${response.status}`);
  }

  const json = await response.json();
  const allModels: OpenRouterModel[] = json.data ?? [];

  const freeModels = sortFreeModels(
    allModels.filter(
      (m) =>
        isFreeModel(m) &&
        supportsChatCompletion(m) &&
        !unavailableModels.has(m.id)
    )
  );

  cachedFreeModels = freeModels;
  if (!isVercelRuntime()) {
    cacheExpiresAt = now + CACHE_TTL_MS;
  }

  return freeModels;
}

export async function getAvailableFreeModels(): Promise<OpenRouterModel[]> {
  const models = await fetchFreeModels();
  return models.filter((m) => !unavailableModels.has(m.id));
}

export function markModelUnavailable(modelId: string): void {
  if (isVercelRuntime() || modelId === "openrouter/free") return;
  unavailableModels.add(modelId);
  if (cachedFreeModels) {
    cachedFreeModels = cachedFreeModels.filter((m) => m.id !== modelId);
  }
}

export const OPENROUTER_QUOTA_USER_MESSAGE =
  "OpenRouter 무료 사용 한도에 도달했습니다. 내일 다시 시도하거나 OpenRouter에 크레딧을 추가해주세요.";

export function rememberSuccessfulModel(modelId: string): void {
  lastSuccessfulModelId = modelId;
}

export function isOpenRouterQuotaExhausted(message: string): boolean {
  const lower = message.toLowerCase();

  // 분당 한도는 다른 모델로 우회 가능
  if (
    lower.includes("free-models-per-min") ||
    lower.includes("per-min") ||
    lower.includes("per minute")
  ) {
    return false;
  }

  return (
    message.includes("무료 사용 한도") ||
    message.includes("한도에 도달") ||
    lower.includes("free-models-per-day") ||
    lower.includes("http 402") ||
    lower.includes("insufficient credits") ||
    (lower.includes("rate limit") && lower.includes("per-day")) ||
    (lower.includes("credit") &&
      (lower.includes("unlock") || lower.includes("add")))
  );
}

export function isOpenRouterRateLimited(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("rate limit") && !isOpenRouterQuotaExhausted(message);
}

export function isModelUnavailableError(
  status: number,
  errorMessage: string
): boolean {
  const msg = errorMessage.toLowerCase();

  if (status === 404) return true;

  const unavailablePatterns = [
    "model not found",
    "does not exist",
    "not available",
    "invalid model",
    "no endpoints found",
    "model is not available",
    "decommissioned",
    "deprecated",
    "end of life",
    "not supported",
    "provider returned error",
    "response_format",
    "json_object",
    "does not support",
    "unsupported",
    "timeout",
    "timed out",
    "aborted",
    "operation was aborted",
    "rate limit",
    "429",
    "503",
    "502",
    "402",
    "credit",
    "quota",
    "busy",
    "overloaded",
    "openrouter",
    "응답 파싱",
    "응답이 비어",
  ];

  return unavailablePatterns.some((p) => msg.includes(p));
}

export function clearModelCache(): void {
  cachedFreeModels = null;
  cacheExpiresAt = 0;
}

export async function resolvePreferredFreeModelIds(
  preferredIds: string[],
  maxCount: number,
  excludeIds: string[] = []
): Promise<string[]> {
  const exclude = new Set(excludeIds);

  const preferredPool = isVercelRuntime()
    ? [...VERCEL_STATIC_MODEL_IDS, ...VERIFIED_FALLBACK_MODEL_IDS]
    : preferredIds;

  const orderedPreferred = [
    ...(lastSuccessfulModelId &&
    !exclude.has(lastSuccessfulModelId) &&
    preferredPool.includes(lastSuccessfulModelId)
      ? [lastSuccessfulModelId]
      : []),
    ...preferredPool.filter((id) => id !== lastSuccessfulModelId),
  ];

  try {
    const available = await getAvailableFreeModels();
    const availableIds = new Set(available.map((model) => model.id));

    const matchedPreferred = orderedPreferred.filter(
      (id) => availableIds.has(id) && !exclude.has(id)
    );

    const extraLive = available
      .map((model) => model.id)
      .filter(
        (id) =>
          !exclude.has(id) &&
          !matchedPreferred.includes(id) &&
          !id.includes("nemotron") &&
          !id.includes("owl-alpha") &&
          !id.includes("coder") &&
          !id.includes("laguna") &&
          !id.includes("lyria")
      );

    const combined = [...new Set([...matchedPreferred, ...extraLive])];
    if (combined.length > 0) {
      return combined.slice(0, maxCount);
    }
  } catch (error) {
    console.warn("[OpenRouter] 모델 목록 조회 실패, 검증된 fallback 사용:", error);
  }

  return [...new Set(orderedPreferred)]
    .filter((id) => !exclude.has(id))
    .slice(0, maxCount);
}
