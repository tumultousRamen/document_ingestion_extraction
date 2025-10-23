import { getTemporalClient } from "./client";
import { exampleWorkflow } from "./workflows/example";

async function main(): Promise<void> {
  const client = await getTemporalClient();

  const workflowId = `example-${Date.now()}`;
  const handle = await client.workflow.start(exampleWorkflow, {
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "default-task-queue",
    workflowId,
    args: [process.env.USER ?? "Temporal"],
  });

  const result = await handle.result();
  console.log("Workflow result:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
