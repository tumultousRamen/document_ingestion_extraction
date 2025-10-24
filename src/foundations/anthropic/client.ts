import type { ZodTypeAny, ZodType } from "zod";
import { env } from "~/env.js";

// Minimal types to keep the client small and focused
export type Role = "system" | "user" | "assistant";
export type Message = { role: Role; content: string };

export type ToolSchema<T> = ZodType<T>;

export type ToolChoice =
  | { type: "auto" }
  | { type: "tool"; name: string }
  | { type: "any" };

export type ClientOptions = {
  model?: string;
  max_tokens?: number;
  temperature?: number;
};

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown };

type AnthropicMessageCreateResponse = {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  stop_reason: string | null;
  usage?: { input_tokens: number; output_tokens: number };
};

// First‑party Anthropic Messages API (minimal)
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages" as const;

function headers(): HeadersInit {
  return {
    "content-type": "application/json",
    "x-api-key": env.ANTHROPIC_KEY,
    "anthropic-version": "2023-06-01",
  };
}

function mapToAnthropicMessages(messages: Message[]): {
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
} {
  const [first, ...rest] = messages;
  const system = first?.role === "system" ? first.content : undefined;
  const conv = (system ? rest : messages).filter(
    (m) => m.role === "user" || m.role === "assistant",
  ) as { role: "user" | "assistant"; content: string }[];
  return { system, messages: conv };
}

export async function handleChatCompletion({
  messages,
  options = {},
}: {
  messages: Message[];
  options?: ClientOptions;
}): Promise<string> {
  const { system, messages: convo } = mapToAnthropicMessages(messages);

  const body = {
    model: options.model ?? "claude-3-5-sonnet-20241022",
    system,
    messages: convo,
    max_tokens: options.max_tokens ?? 1024,
    temperature: options.temperature ?? 0,
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Anthropic chat failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as AnthropicMessageCreateResponse;
  const firstText = data.content?.find(
    (b): b is { type: "text"; text: string } => b.type === "text",
  );
  if (!firstText?.text) {
    throw new Error("Unexpected Anthropic response: missing text content");
  }
  return firstText.text;
}

export async function handleToolCompletion<T>({
  messages,
  functionName,
  schema,
  toolChoice,
  options = {},
}: {
  messages: Message[];
  functionName: string;
  schema: ToolSchema<T>;
  toolChoice?: ToolChoice;
  options?: ClientOptions;
}): Promise<T> {
  const { system, messages: convo } = mapToAnthropicMessages(messages);

  const tools = [
    {
      name: functionName,
      description: "Tool call schema",
      input_schema: (
        schema as unknown as ZodTypeAny & { toJSON?: () => unknown }
      ).toJSON?.() ?? {
        type: "object",
      },
      // Fallback minimal JSON‑schema if Zod's toJSON is not available
    },
  ];

  const body: Record<string, unknown> = {
    model: options.model ?? "claude-3-5-sonnet-20241022",
    system,
    messages: convo,
    tools,
    max_tokens: options.max_tokens ?? 1024,
    temperature: options.temperature ?? 0,
  };

  if (toolChoice) {
    body.tool_choice = toolChoice;
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Anthropic tool call failed: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as AnthropicMessageCreateResponse;
  const toolUse = data.content?.find((b) => b.type === "tool_use") as
    | { type: "tool_use"; id: string; name: string; input: unknown }
    | undefined;

  if (toolUse?.name !== functionName) {
    throw new Error(
      "Unexpected Anthropic response: missing tool_use for function",
    );
  }

  const parsed = schema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error("Invalid tool arguments returned by model");
  }
  return parsed.data;
}
