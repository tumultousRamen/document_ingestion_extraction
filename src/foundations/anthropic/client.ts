import type { ZodTypeAny, ZodType } from "zod";
import { env } from "~/env.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

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

export function validateAsAnthropicTool<T extends z.ZodTypeAny>({
  name,
  validator,
  description,
}: {
  name: string;
  validator: T;
  description?: string;
}) {
  const schema = zodToJsonSchema(validator);

  // remove $schema key
  delete schema.$schema;

  const asObjectSchema = z
    .object({
      type: z.literal("object"),
    })
    .passthrough()
    .parse(schema);

  return {
    name,
    description,
    input_schema: asObjectSchema,
  };
}

async function fixToolCallArguments<T>({
  error,
  previousArguments,
  resolver,
  functionName,
  toolChoice,
}: {
  error: z.ZodError;
  previousArguments: unknown;
  resolver: z.ZodType<T>;
  functionName: string;
  toolChoice?: ToolChoice;
}): Promise<T> {
  const body: Record<string, unknown> = {
    model: "claude-3-5-sonnet-20241022",
    messages: [
      {
        role: "user",
        content:
          "You are an AI assistant tasked with correcting invalid JSON output based on a zod error. You will be provided with a tool calling schema, a zod error, and the previous arguments that caused the error. Your goal is to analyze the error, correct the arguments, and output the corrected arguments in the proper JSON structure.\n\n" +
          "Here is the zod error that was encountered:\n<zod_error>\n" +
          JSON.stringify(error.format(), null, 2) +
          "\n</zod_error>\n\nHere are the previous arguments that caused the error:\n<previous_arguments>\n" +
          JSON.stringify(previousArguments, null, 2) +
          "\n</previous_arguments>\n\nTo complete this task, follow these steps:\n\n1. Carefully analyze the zod error message. It will indicate which part of the JSON structure is invalid and why.\n\n2. Compare the error message with the tool calling schema and the previous arguments to identify the specific issues that need to be corrected.\n\n3. Make the necessary corrections to the arguments, ensuring that they conform to the structure and types specified in the tool calling schema.\n\n4. Output the corrected arguments in a structure that matches the tool calling schema. Make sure to include all required fields and use the correct data types.\n\n5. Double-check that your corrected output addresses all issues mentioned in the zod error and fully complies with the tool calling schema.",
      },
    ],
    tools: [
      validateAsAnthropicTool({
        name: functionName,
        validator: resolver as unknown as ZodTypeAny,
      }),
    ],
    max_tokens: 1024,
    temperature: 0,
  };

  if (toolChoice)
    body.tool_choice = toolChoice as unknown as Record<string, unknown>;

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

  if (!toolUse) {
    throw new Error(
      "Unexpected Anthropic response: missing tool_use for function (fix)",
    );
  }

  const parsed = resolver.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(
      `Invalid tool arguments returned by model after fix: ${parsed.error.message}`,
    );
  }
  return parsed.data;
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
    validateAsAnthropicTool({
      name: functionName,
      validator: schema as unknown as ZodTypeAny,
      description: "Tool call schema",
    }),
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

  const parsed = (schema as unknown as z.ZodType<T>).safeParse(toolUse.input);
  if (!parsed.success) {
    // attempt to fix arguments using a follow-up tool call
    return await fixToolCallArguments<T>({
      error: parsed.error,
      previousArguments: toolUse.input,
      resolver: schema as unknown as z.ZodType<T>,
      functionName,
      toolChoice,
    });
  }
  return parsed.data;
}
