import { Worker } from "@temporalio/worker";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as activities from "./activities";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function run(): Promise<void> {
  const workflowsPath = join(__dirname, "./workflows");

  const worker = await Worker.create({
    workflowsPath,
    activities,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "default-task-queue",
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
