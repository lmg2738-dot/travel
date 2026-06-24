import {
  getAvailableFreeModels,
  markModelUnavailable,
  isModelUnavailableError,
  resolvePreferredFreeModelIds,
  PREFERRED_FREE_MODEL_IDS,
  VERIFIED_FALLBACK_MODEL_IDS,
} from "./models";
import type { ChatMessage, ChatCompletionResponse } from "./types";
import { getGenerateRuntimeConfig } from "@/lib/runtime-config";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
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

export async function chatWithModel(
  modelId: string,
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<{ content: string; model: string }> {
  const runtime = getGenerateRuntimeConfig();
  const apiKey = getApiKey();
  const timeoutMs = options.timeoutMs ?? runtime.openRouterTimeoutMs;
  const jsonAttempts: boolean[] = options.jsonMode ? [true, false] : [false];

  let lastError: Error | null = null;

  for (const useJsonMode of jsonAttempts) {
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

      if (isRetryableError(message) && useJsonMode && jsonAttempts.includes(false)) {
        lastError = error instanceof Error ? error : new Error(message);
        continue;
      }

      throw error instanceof Error ? error : new Error(message);
    }
  }

  throw lastError ?? new Error(`모델 ${modelId} 호출에 실패했습니다.`);
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

  let data: ChatCompletionResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error(`OpenRouter API 오류: HTTP ${response.status}`);
  }

  const errorMsg = data.error?.message ?? "";

  if (!response.ok) {
    throw new Error(errorMsg || `OpenRouter API 오류: HTTP ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 응답이 비어 있습니다.");
  }

  return { content, model: data.model ?? modelId };
}

async function resolveModelIds(options: ChatOptions): Promise<string[]> {
  const runtime = getGenerateRuntimeConfig();
  const maxAttempts = options.maxModelAttempts ?? runtime.maxModelAttempts;
  const exclude = options.excludeModelIds ?? [];

  const preferred =
    options.preferredModelIds ??
    (runtime.useFastModelList
      ? PREFERRED_FREE_MODEL_IDS
      : PREFERRED_FREE_MODEL_IDS);

  return resolvePreferredFreeModelIds(preferred, maxAttempts, exclude);
}

export async function chatWithFreeModels(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<{ content: string; model: string }> {
  const runtime = getGenerateRuntimeConfig();
  const apiKey = getApiKey();
  const timeoutMs = options.timeoutMs ?? runtime.openRouterTimeoutMs;
  const maxAttempts = options.maxModelAttempts ?? runtime.maxModelAttempts;

  const modelIds = await resolveModelIds({
    ...options,
    maxModelAttempts: maxAttempts,
  });

  if (modelIds.length === 0) {
    const fallback = VERIFIED_FALLBACK_MODEL_IDS.filter(
      (id) => !options.excludeModelIds?.includes(id)
    );
    if (fallback.length === 0) {
      throw new Error(
        "사용 가능한 OpenRouter 무료 모델이 없습니다. 잠시 후 다시 시도해주세요."
      );
    }
    modelIds.push(...fallback.slice(0, maxAttempts));
  }

  let lastError: Error | null = null;

  for (const modelId of modelIds) {
    const jsonAttempts: boolean[] = options.jsonMode ? [true, false] : [false];

    for (const useJsonMode of jsonAttempts) {
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

          if (useJsonMode && jsonAttempts.includes(false)) {
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
