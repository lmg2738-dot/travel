import type { OpenRouterModel } from "./types";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

/** JSON 일정 생성에 적합한 무료 모델 우선순위 */
const PREFERRED_FREE_MODEL_IDS = [
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-235b-a22b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

const EXCLUDED_MODEL_PATTERNS = [
  /lyria/i,
  /clip-preview/i,
  /audio/i,
  /whisper/i,
  /dall-?e/i,
  /stable-?diffusion/i,
  /image/i,
  /vision-only/i,
  /embedding/i,
  /rerank/i,
];

/** 런타임 중 사용 불가로 확인된 모델 ID */
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

/** 무료 모델 우선순위: 화이트리스트 → 컨텍스트 길이 */
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
    next: { revalidate: 3600 },
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
  ];

  return unavailablePatterns.some((p) => msg.includes(p));
}

export function clearModelCache(): void {
  cachedFreeModels = null;
  cacheExpiresAt = 0;
}
