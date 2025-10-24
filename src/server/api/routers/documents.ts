/*
Router to upload documents to S3 and return object key
*/
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { putObject } from "~/foundations/aws/s3";
import { getTemporalClient } from "~/temporal/client";
import { processDocument } from "~/temporal/workflows/process";

const temporalClient = await getTemporalClient();

const documentsRouter = createTRPCRouter({
  upload: publicProcedure
    .input(
      z.object({
        brokerId: z.string(),
        files: z.array(z.instanceof(File)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { files, brokerId } = input;

      const results = await Promise.all(
        files.map(async (file) => {
          const objectKey = `${randomUUID()}-${file.name}`;
          const buffer = await file.arrayBuffer();
          await putObject(objectKey, Buffer.from(buffer), file.type);
          return {
            objectKey,
            file,
          };
        }),
      );

      const documents = await ctx.db.document.createManyAndReturn({
        data: results.map(({ objectKey, file }) => ({
          objectKey,
          name: file.name,
          type: file.type,
          size: file.size,
          broker: {
            connect: {
              brokerId,
            },
          },
        })),
      });

      //Documents have been uploaded, created a scaffolded out document records in the database.
      // Now kick off temporal workflow to proocess uploaded documents.
      await Promise.all(
        documents.map(async (document) => {
          await temporalClient.workflow.start(processDocument, {
            workflowId: `process-document-${document.id}`,
            taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "default-task-queue",
            workflowExecutionTimeout: "1 hour",
            workflowRunTimeout: "1 hour",
            args: [{ document, brokerId }],
          });
        }),
      );
    }),
});

export { documentsRouter };
