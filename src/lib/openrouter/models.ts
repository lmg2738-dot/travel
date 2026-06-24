import type { OpenRouterModel } from "./types";

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * OpenRouter API로 검증된 무료 모델 (2026-06 기준)
 * 모델 목록 API 실패 시에만 사용
 */
export const VERIFIED_FALLBACK_MODEL_IDS = [
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/free",
];

/** Vercel에서는 라우터 대신 검증된 단일 모델만 사용 */
export const VERCEL_VERIFIED_MODEL_IDS = [
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
];

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
  /liquid\/lfm/i,
  /fugu/i,
  /:vl$/i,
  /vl:free/i,
];

const unavailableModels = new Set<string>();

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
  if (cachedFreeModels && now < cacheExpiresAt) {
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
  cacheExpiresAt = now + CACHE_TTL_MS;

  return freeModels;
}

export async function getAvailableFreeModels(): Promise<OpenRouterModel[]> {
  const models = await fetchFreeModels();
  return models.filter((m) => !unavailableModels.has(m.id));
}

export function markModelUnavailable(modelId: string): void {
  if (modelId === "openrouter/free") return;
  unavailableModels.add(modelId);
  if (cachedFreeModels) {
    cachedFreeModels = cachedFreeModels.filter((m) => m.id !== modelId);
  }
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

  if (isVercelRuntime()) {
    const verified = VERCEL_VERIFIED_MODEL_IDS.filter((id) => !exclude.has(id));
    if (verified.length > 0) {
      return verified.slice(0, maxCount);
    }
  }

  try {
    const available = await getAvailableFreeModels();
    const availableIds = new Set(available.map((model) => model.id));

    const matchedPreferred = preferredIds.filter(
      (id) => availableIds.has(id) && !exclude.has(id)
    );
    if (matchedPreferred.length > 0) {
      return matchedPreferred.slice(0, maxCount);
    }

    const liveModels = available
      .map((model) => model.id)
      .filter((id) => !exclude.has(id));

    if (liveModels.length > 0) {
      return liveModels.slice(0, maxCount);
    }
  } catch (error) {
    console.warn("[OpenRouter] 모델 목록 조회 실패, 검증된 fallback 사용:", error);
  }

  return VERIFIED_FALLBACK_MODEL_IDS.filter((id) => !exclude.has(id)).slice(
    0,
    maxCount
  );
}
