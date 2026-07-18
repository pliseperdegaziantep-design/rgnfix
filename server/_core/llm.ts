import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };
export type ImageContent = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};
export type MessageContent = string | TextContent | ImageContent | FileContent;
export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = { type: "function"; function: { name: string } };
export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};
export type OutputSchema = JsonSchema;
export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};
export type ModelsResponse = { object: string; data: ModelInfo[] };

type Provider = "anthropic" | "openai" | "forge";
type AnthropicCredential = { key: string; source: string };

const ANTHROPIC_KEY_NAMES = ["ANTHROPIC_API_KEY", "CLAUDE_API_KEY", "CLOUDEIP"] as const;

function anthropicCredential(): AnthropicCredential | null {
  for (const source of ANTHROPIC_KEY_NAMES) {
    const key = process.env[source]?.trim() ?? "";
    if (key.startsWith("sk-ant-")) return { key, source };
  }
  return null;
}

function invalidAnthropicVariable(): string | null {
  for (const source of ANTHROPIC_KEY_NAMES) {
    const value = process.env[source]?.trim() ?? "";
    if (value && !value.startsWith("sk-ant-")) return source;
  }
  return null;
}

const anthropicKey = () => anthropicCredential()?.key ?? "";
const anthropicModel = () =>
  process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";
const anthropicUrl = () =>
  process.env.ANTHROPIC_API_URL?.trim() || "https://api.anthropic.com/v1/messages";

export function getLLMStatus() {
  const credential = anthropicCredential();
  if (credential) {
    return {
      configured: true,
      provider: "anthropic" as const,
      model: anthropicModel(),
      keySource: credential.source,
      message: "Claude API anahtarı algılandı.",
    };
  }

  const invalidSource = invalidAnthropicVariable();
  if (invalidSource) {
    return {
      configured: false,
      provider: "anthropic" as const,
      model: anthropicModel(),
      keySource: invalidSource,
      message: `${invalidSource} değeri gerçek bir Claude API anahtarı değil. Anahtar sk-ant- ile başlamalı.`,
    };
  }

  if (ENV.openAiApiKey.trim()) {
    return {
      configured: true,
      provider: "openai" as const,
      model: ENV.openAiModel || "varsayılan",
      keySource: "OPENAI_API_KEY",
      message: "OpenAI bağlantısı algılandı.",
    };
  }

  if (ENV.forgeApiKey.trim()) {
    return {
      configured: true,
      provider: "forge" as const,
      model: "varsayılan",
      keySource: "BUILT_IN_FORGE_API_KEY",
      message: "Forge bağlantısı algılandı.",
    };
  }

  return {
    configured: false,
    provider: "none" as const,
    model: anthropicModel(),
    keySource: null,
    message: "Claude API anahtarı bulunamadı. Hostinger'a ANTHROPIC_API_KEY ekleyin.",
  };
}

export function toPublicLLMError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("tanımlı değil") || normalized.includes("bulunamadı")) {
    return "Claude API anahtarı sunucuda bulunamadı. Hostinger ortam değişkenlerinde ANTHROPIC_API_KEY değerini kontrol edin ve yeniden dağıtım yapın.";
  }
  if (normalized.includes("401") || normalized.includes("authentication_error") || normalized.includes("invalid x-api-key")) {
    return "Claude API anahtarı geçersiz veya iptal edilmiş. Anthropic Console'dan yeni bir API anahtarı oluşturup Hostinger'a kaydedin.";
  }
  if (normalized.includes("402") || normalized.includes("credit") || normalized.includes("billing") || normalized.includes("balance")) {
    return "Anthropic API hesabında kullanılabilir kredi veya aktif faturalandırma bulunmuyor.";
  }
  if (normalized.includes("403") || normalized.includes("permission")) {
    return "Claude API anahtarının bu modele erişim izni yok.";
  }
  if (normalized.includes("404") || normalized.includes("not_found_error") || normalized.includes("model")) {
    return `Claude modeli kullanılamıyor. Hostinger'daki ANTHROPIC_MODEL değerini kaldırın veya ${anthropicModel()} olarak ayarlayın.`;
  }
  if (normalized.includes("429") || normalized.includes("rate_limit")) {
    return "Claude API kullanım limiti aşıldı. Bir süre sonra tekrar deneyin veya Anthropic kullanım limitlerini kontrol edin.";
  }
  if (normalized.includes("fetch failed") || normalized.includes("enotfound") || normalized.includes("network")) {
    return "Sunucu Claude API'ye bağlanamadı. Hostinger çalışma zamanı ağ bağlantısını kontrol edin.";
  }

  return "Claude API bağlantısı başarısız oldu. Ayrıntı Hostinger çalışma zamanı günlüklerine kaydedildi.";
}

function resolveProvider(): Provider {
  const credential = anthropicCredential();
  if (credential) return "anthropic";

  const invalidSource = invalidAnthropicVariable();
  if (invalidSource) {
    throw new Error(`${invalidSource} gerçek bir Anthropic API anahtarı değil; değer sk-ant- ile başlamalı`);
  }

  if (ENV.openAiApiKey.trim()) return "openai";
  if (ENV.forgeApiKey.trim()) return "forge";
  throw new Error(
    "ANTHROPIC_API_KEY, OPENAI_API_KEY veya BUILT_IN_FORGE_API_KEY tanımlı değil"
  );
}

function parts(content: Message["content"]): MessageContent[] {
  return Array.isArray(content) ? content : [content];
}

function textOf(content: Message["content"]): string {
  return parts(content)
    .map(part => {
      if (typeof part === "string") return part;
      if (part.type === "text") return part.text;
      if (part.type === "image_url") return `[Görsel: ${part.image_url.url}]`;
      if (part.type === "file_url") return `[Dosya: ${part.file_url.url}]`;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function normalizeOpenAiMessage(message: Message) {
  return {
    role: message.role,
    content: textOf(message.content),
    ...(message.name ? { name: message.name } : {}),
    ...(message.tool_call_id ? { tool_call_id: message.tool_call_id } : {}),
  };
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok || response.status < 500 || attempt === 2) return response;
      await response.body?.cancel().catch(() => undefined);
    } catch (error) {
      lastError = error;
      if (attempt === 2) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw lastError instanceof Error ? lastError : new Error("LLM isteği başarısız oldu");
}

async function invokeAnthropic(params: InvokeParams): Promise<InvokeResult> {
  const key = anthropicKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY bulunamadı");

  const system = params.messages
    .filter(message => message.role === "system")
    .map(message => textOf(message.content))
    .filter(Boolean)
    .join("\n\n");

  const messages = params.messages
    .filter(message => message.role === "user" || message.role === "assistant")
    .map(message => ({
      role: message.role as "user" | "assistant",
      content: textOf(message.content),
    }));

  const response = await fetchWithRetry(anthropicUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model || anthropicModel(),
      max_tokens: params.max_tokens ?? params.maxTokens ?? 1200,
      ...(system ? { system } : {}),
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API hatası: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    id: string;
    model: string;
    content?: Array<{ type: string; text?: string }>;
    stop_reason?: string | null;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const content = (data.content ?? [])
    .filter(block => block.type === "text" && typeof block.text === "string")
    .map(block => block.text)
    .join("\n");
  const promptTokens = data.usage?.input_tokens ?? 0;
  const completionTokens = data.usage?.output_tokens ?? 0;

  return {
    id: data.id,
    created: Math.floor(Date.now() / 1000),
    model: data.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: data.stop_reason ?? null,
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

async function invokeOpenAiCompatible(
  provider: "openai" | "forge",
  params: InvokeParams
): Promise<InvokeResult> {
  const baseUrl =
    provider === "openai"
      ? ENV.openAiApiUrl.replace(/\/$/, "")
      : ENV.forgeApiUrl.trim()
        ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1`
        : "https://forge.manus.im/v1";
  const apiKey = provider === "openai" ? ENV.openAiApiKey : ENV.forgeApiKey;
  const responseFormat = params.responseFormat || params.response_format;
  const outputSchema = params.outputSchema || params.output_schema;

  const payload: Record<string, unknown> = {
    messages: params.messages.map(normalizeOpenAiMessage),
    model: params.model || (provider === "openai" ? ENV.openAiModel : undefined),
  };
  if (!payload.model) delete payload.model;
  if (params.tools?.length) payload.tools = params.tools;
  if (params.toolChoice || params.tool_choice) {
    payload.tool_choice = params.toolChoice || params.tool_choice;
  }
  if (typeof (params.max_tokens ?? params.maxTokens) === "number") {
    payload.max_tokens = params.max_tokens ?? params.maxTokens;
  }
  if (responseFormat) payload.response_format = responseFormat;
  else if (outputSchema) {
    payload.response_format = { type: "json_schema", json_schema: outputSchema };
  }
  if (params.thinking) payload.thinking = params.thinking;
  if (params.reasoning) payload.reasoning = params.reasoning;

  const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM API hatası: ${response.status} ${body}`);
  }
  return (await response.json()) as InvokeResult;
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const provider = resolveProvider();
  return provider === "anthropic"
    ? invokeAnthropic(params)
    : invokeOpenAiCompatible(provider, params);
}

export async function listLLMModels(): Promise<ModelsResponse> {
  const provider = resolveProvider();
  if (provider === "anthropic") {
    return {
      object: "list",
      data: [
        {
          id: anthropicModel(),
          object: "model",
          created: 0,
          owned_by: "anthropic",
        },
      ],
    };
  }

  const baseUrl =
    provider === "openai"
      ? ENV.openAiApiUrl.replace(/\/$/, "")
      : ENV.forgeApiUrl.trim()
        ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1`
        : "https://forge.manus.im/v1";
  const apiKey = provider === "openai" ? ENV.openAiApiKey : ENV.forgeApiKey;
  const response = await fetchWithRetry(`${baseUrl}/models`, {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`Model listesi alınamadı: ${response.status}`);
  }
  return (await response.json()) as ModelsResponse;
}
