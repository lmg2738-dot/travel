export interface OpenRouterModelPricing {
  prompt: string;
  completion: string;
  request?: string;
  image?: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: OpenRouterModelPricing;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string | null;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  model?: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    code?: number;
  };
}
