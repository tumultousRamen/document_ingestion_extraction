import { proxyActivities } from "@temporalio/workflow";
import type { Activities } from "~/temporal/activities";

const activities = proxyActivities<Activities>({
  startToCloseTimeout: "1 minute",
});

export async function exampleWorkflow(name: string): Promise<string> {
  const greeting = await activities.greetActivity(name);
  return `${greeting} Welcome to Temporal!`;
}

export type ExampleWorkflow = typeof exampleWorkflow;
