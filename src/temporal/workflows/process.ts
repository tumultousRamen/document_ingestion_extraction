import { proxyActivities } from "@temporalio/workflow";
import type { Activities } from "~/temporal/activities";
import type { Document } from "@prisma/client";

const activities = proxyActivities<Activities>({
  startToCloseTimeout: "1 minute",
});

export async function processDocument(documents: Document[]): Promise<void>;
