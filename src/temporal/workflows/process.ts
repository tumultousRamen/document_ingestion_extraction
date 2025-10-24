import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "~/temporal/activities";
import type { Document, Broker } from "@prisma/client";

const {
  parseDocumentWithReducto,
  extractBrokerFromDocument,
  createBroker,
  extractPropertiesFromDocument,
  createManyPropertiesForBroker,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function processBroker({
  document,
}: {
  document: Document;
}): Promise<void> {
  const parsed = await parseDocumentWithReducto({
    objectKey: document.objectKey,
  });

  const extractedBroker = await extractBrokerFromDocument(parsed);

  await createBroker(extractedBroker);
}

export async function processDocument({
  document,
  brokerId,
}: {
  document: Document;
  brokerId: string;
}): Promise<void> {
  // parse document and append the properties to the passed broker
  const parsed = await parseDocumentWithReducto({
    objectKey: document.objectKey,
  });

  const props = await extractPropertiesFromDocument({ parsedDocument: parsed });
  await createManyPropertiesForBroker({
    brokerId,
    properties: props,
  });
}
