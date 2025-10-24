import { parseDocument } from "~/foundations/reducto/reducto";
import { getPresignedUrls } from "~/foundations/aws/s3";
import { handleToolCompletion } from "~/foundations/anthropic/client";
import { z } from "zod";
import {
  addressValidator,
  type AddressDTO,
} from "~/foundations/validators/address";
import { propertiesSystemPrompt, buildPropertiesUserPrompt } from "./prompts";
import { db } from "~/server/db";
import type { Address } from "@prisma/client";

type ParseDocumentWithReductoArgs = {
  objectKey: string;
  delimiterStyle?: "simple" | "numbered";
};

export async function parseDocumentWithReducto({
  objectKey,
  delimiterStyle = "simple",
}: ParseDocumentWithReductoArgs): Promise<string> {
  const { GET } = await getPresignedUrls({
    key: objectKey,
  });

  const { chunks } = await parseDocument(GET, {});

  if (delimiterStyle === "numbered") {
    return chunks
      .map(
        (chunk, i) =>
          `<START_PAGE_${i + 1}>\n${chunk.content}\n<END_PAGE_${i + 1}>`,
      )
      .join("\n");
  }

  return chunks.map((chunk) => chunk.content).join("\n<END_PAGE>\n");
}

// process document to extract properties data

export async function extractPropertiesFromDocument({
  parsedDocument,
}: {
  parsedDocument: string;
}): Promise<AddressDTO[]> {
  // use parsed text with tool call
  const functionName = "extract_properties";
  const arraySchema = z.array(addressValidator);
  const messages = [
    { role: "system", content: propertiesSystemPrompt },
    { role: "user", content: buildPropertiesUserPrompt(parsedDocument) },
  ] as const;

  const properties = await handleToolCompletion<AddressDTO[]>({
    messages: messages as unknown as {
      role: "system" | "user";
      content: string;
    }[],
    functionName,
    schema: arraySchema,
    toolChoice: { type: "tool", name: functionName },
    options: { temperature: 0 },
  });

  return properties;
}

export async function createManyPropertiesForBroker({
  brokerId,
  properties,
}: {
  brokerId: string;
  properties: AddressDTO[];
}): Promise<Address[]> {
  if (!properties.length) return [];

  // Minimal de-duplication by stringified key of main components
  const seen = new Set<string>();
  const unique = properties.filter((p) => {
    const key = [
      p.streetAddress?.trim().toLowerCase() ?? "",
      p.unitType?.trim().toLowerCase() ?? "",
      p.unitNumber?.trim().toLowerCase() ?? "",
      p.cityTown?.trim().toLowerCase() ?? "",
      p.state?.trim().toLowerCase() ?? "",
      p.zipCode?.trim().toLowerCase() ?? "",
      p.province?.trim().toLowerCase() ?? "",
      p.postalCode?.trim().toLowerCase() ?? "",
      p.country?.trim().toLowerCase() ?? "",
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Persist and link to broker
  const created: Address[] = [];
  for (const p of unique) {
    const addr = await db.address.create({
      data: {
        brokerId,
        inCareOfName: p.inCareOfName,
        streetAddress: p.streetAddress,
        unitType: p.unitType,
        unitNumber: p.unitNumber,
        cityTown: p.cityTown,
        state: p.state,
        zipCode: p.zipCode,
        province: p.province,
        postalCode: p.postalCode,
        country: p.country,
      },
    });
    created.push(addr);
  }

  return created;
}
