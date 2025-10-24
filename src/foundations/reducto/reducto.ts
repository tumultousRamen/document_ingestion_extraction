import { z } from "zod";
import { env } from "~/env.js";

// Minimal types for parse-only client
export type ParsedChunk = {
  content: string;
};

export type ParseFullResult = {
  type: "full";
  chunks: ParsedChunk[];
};

// Validators for the minimal response handling
const parseFullResultValidator = z.object({
  type: z.literal("full"),
  chunks: z.array(z.object({ content: z.string() })),
});

const parseUrlResultValidator = z.object({
  type: z.literal("url"),
  url: z.string().url(),
});

const parseResponseValidator = z.object({
  result: z.discriminatedUnion("type", [
    parseFullResultValidator,
    parseUrlResultValidator,
  ]),
});

type ParseResponse = z.infer<typeof parseResponseValidator>;

const BASE_URL = "https://platform.reducto.ai" as const;

function getAuthHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.REDUCTO_KEY}`,
  };
}

export type ParseOptions = {
  pageRange?: { start?: number; end?: number };
  chunkMode?:
    | "variable"
    | "section"
    | "page"
    | "block"
    | "disabled"
    | "page_sections";
  useFigureSummary?: boolean;
};

export async function parseDocument(
  url: string,
  { pageRange, chunkMode = "page", useFigureSummary = true }: ParseOptions = {},
): Promise<ParseFullResult> {
  const body = {
    document_url: url,
    options: {
      chunking: { chunk_mode: chunkMode },
      ...(useFigureSummary && {
        figure_summary: {
          enabled: true,
          prompt:
            "Enclose the description in square brackets and prefix it with an exclamation mark, like this: ![Description of the image]",
        },
      }),
    },
    advanced_options: {
      table_output_format: "md",
      page_range: pageRange ?? { end: 250 },
    },
  };

  const res = await fetch(`${BASE_URL}/parse`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Reducto parse failed: ${res.status} ${res.statusText}`);
  }

  const parsed: ParseResponse = parseResponseValidator.parse(await res.json());

  if (parsed.result.type === "full") {
    return parsed.result;
  }

  // If Reducto returns a URL, fetch and validate the full result
  const urlRes = await fetch(parsed.result.url, { method: "GET" });
  if (!urlRes.ok) {
    throw new Error(
      `Failed to fetch parse URL: ${urlRes.status} ${urlRes.statusText}`,
    );
  }

  const full = parseFullResultValidator.parse(await urlRes.json());
  return full;
}
