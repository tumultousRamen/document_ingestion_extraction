import { brokerValidator } from "~/foundations/validators/broker";
import { handleToolCompletion } from "~/foundations/anthropic/client";
import { brokerSystemPrompt, buildBrokerUserPrompt } from "./prompts";
import type { BrokerDTO } from "~/foundations/validators/broker";
import { db } from "~/server/db";
import type { Broker } from "@prisma/client";

export async function extractBrokerFromDocument(
  parsedDocument: string,
): Promise<BrokerDTO> {
  const functionName = "extract_broker";

  const userPrompt = buildBrokerUserPrompt(parsedDocument);

  const result = await handleToolCompletion<BrokerDTO>({
    messages: [
      { role: "system", content: brokerSystemPrompt },
      { role: "user", content: userPrompt },
    ],
    functionName,
    schema: brokerValidator,
    toolChoice: { type: "tool", name: functionName },
    options: { temperature: 0 },
  });

  return result;
}

export async function createBroker(
  extractedBroker: BrokerDTO,
): Promise<Broker> {
  const broker = await db.broker.create({
    data: extractedBroker,
  });
  return broker;
}
