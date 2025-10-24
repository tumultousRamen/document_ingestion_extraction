import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "~/temporal/activities";
import type { Document } from "@prisma/client";

const { parseDocumentWithReducto, extractBrokerFromDocument, createBroker } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "1 minute",
  });

export async function processBroker(document: Document): Promise<void> {
  const parsed = await parseDocumentWithReducto({
    objectKey: document.objectKey,
  });

  const extractedBroker = await extractBrokerFromDocument(parsed);

  await createBroker(extractedBroker);
}
