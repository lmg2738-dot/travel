import {
  getAvailableFreeModels,
  markModelUnavailable,
  isModelUnavailableError,
  resolvePreferredFreeModelIds,
} from "./models";
import type { ChatMessage, ChatCompletionResponse } from "./types";
import {
  getGenerateRuntimeConfig,
  VERCEL_FAST_MODELS,
} from "@/lib/runtime-config";
import { PREFERRED_FREE_MODEL_IDS } from "./models";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요."
    );
  }
  return key;
}

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:50002";
}

function isRetryableError(message: string): boolean {
  return isModelUnavailableError(0, message);
}

interface ChatOptions {
  jsonMode?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
  maxModelAttempts?: number;
  preferredModelIds?: string[];
  excludeModelIds?: string[];
}

async function requestChat(
  apiKey: string,
  modelId: string,
  messages: ChatMessage[],
  options: ChatOptions,
  useJsonMode: boolean,
  timeoutMs: number
): Promise<{ content: string; model: string }> {
  const body: Record<string, unknown> = {
    model: modelId,
    messages,
    max_tokens: options.maxTokens ?? 4096,
  };

  if (useJsonMode && options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getSiteUrl(),
      "X-Title": "TripMind AI",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data: ChatCompletionResponse = await response.json();
  const errorMsg = data.error?.message ?? "";

  if (!response.ok) {
    throw new Error(errorMsg || `OpenRouter API 오류: HTTP ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 응답이 비어 있습니다.");
  }

  return { content, model: modelId };
}

async function resolveModelIds(options: ChatOptions): Promise<string[]> {
  const runtime = getGenerateRuntimeConfig();
  const maxAttempts = options.maxModelAttempts ?? runtime.maxModelAttempts;
  const exclude = options.excludeModelIds ?? [];

  if (options.preferredModelIds?.length) {
    return resolvePreferredFreeModelIds(
      options.preferredModelIds,
      maxAttempts,
      exclude
    );
  }

  if (runtime.useFastModelList) {
    return resolvePreferredFreeModelIds(
      VERCEL_FAST_MODELS,
      maxAttempts,
      exclude
    );
  }

  const models = await getAvailableFreeModels();
  return models
    .map((model) => model.id)
    .filter((id) => !exclude.includes(id))
    .slice(0, maxAttempts);
}

/**
 * OpenRouter 무료 모델만 사용하며, 실패 시 다음 모델로 자동 전환
 */
export async function chatWithFreeModels(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<{ content: string; model: string }> {
  const runtime = getGenerateRuntimeConfig();
  const apiKey = getApiKey();
  const timeoutMs = options.timeoutMs ?? runtime.openRouterTimeoutMs;
  const maxAttempts = options.maxModelAttempts ?? runtime.maxModelAttempts;

  const preferredIds = runtime.useFastModelList
    ? VERCEL_FAST_MODELS
    : PREFERRED_FREE_MODEL_IDS;

  const modelIds = await resolveModelIds({
    ...options,
    preferredModelIds: options.preferredModelIds ?? preferredIds,
    maxModelAttempts: maxAttempts,
  });

  if (modelIds.length === 0) {
    throw new Error(
      "사용 가능한 OpenRouter 무료 모델이 없습니다. 잠시 후 다시 시도해주세요."
    );
  }

  let lastError: Error | null = null;

  for (let i = 0; i < modelIds.length; i++) {
    const modelId = modelIds[i];
    const isLastModel = i === modelIds.length - 1;
    const attempts: boolean[] =
      options.jsonMode && isLastModel ? [true, false] : [true];

    for (const useJsonMode of attempts) {
      try {
        return await requestChat(
          apiKey,
          modelId,
          messages,
          options,
          useJsonMode,
          timeoutMs
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (isRetryableError(message)) {
          console.warn(
            `[OpenRouter] 모델 재시도/제외: ${modelId} (json=${useJsonMode}) - ${message}`
          );
          lastError = error instanceof Error ? error : new Error(message);

          if (useJsonMode && isLastModel) {
            continue;
          }

          markModelUnavailable(modelId);
          break;
        }

        throw error instanceof Error ? error : new Error(message);
      }
    }
  }

  throw (
    lastError ??
    new Error("모든 무료 모델 시도에 실패했습니다. 잠시 후 다시 시도해주세요.")
  );
}
