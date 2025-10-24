/*
Router to upload documents to S3 and return object key
*/
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getPresignedUrls } from "~/foundations/aws/s3";
import { getTemporalClient } from "~/temporal/client";
import { processDocument } from "~/temporal/workflows/process";

const temporalClient = await getTemporalClient();

const documentsRouter = createTRPCRouter({
  getUploadUrls: publicProcedure
    .input(
      z.object({
        files: z
          .array(z.object({ name: z.string(), type: z.string().optional() }))
          .max(10),
      }),
    )
    .mutation(async ({ input }) => {
      const entries = await Promise.all(
        input.files.map(async (f) => {
          const objectKey = `${randomUUID()}-${f.name}`;
          const { PUT } = await getPresignedUrls({ key: objectKey });
          return { objectKey, url: PUT, name: f.name, type: f.type };
        }),
      );
      return { entries };
    }),
  upload: publicProcedure
    .input(
      z.object({
        brokerId: z.string(),
        files: z
          .array(
            z.object({
              objectKey: z.string(),
              name: z.string(),
              type: z.string().optional(),
            }),
          )
          .max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { files, brokerId } = input;

      const documents = await ctx.db.document.createManyAndReturn({
        data: files.map((file) => ({
          objectKey: file.objectKey,
          name: file.name,
          type: file.type,
          brokerId,
        })),
      });

      //Documents have been uploaded, created a scaffolded out document records in the database.
      // Now kick off temporal workflow to proocess uploaded documents.
      await Promise.all(
        documents.map(async (document) => {
          await temporalClient.workflow.start(processDocument, {
            workflowId: `process-document-${document.id}`,
            taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "default",
            workflowExecutionTimeout: "1 hour",
            workflowRunTimeout: "1 hour",
            args: [{ document, brokerId }],
          });
        }),
      );
    }),
});

export { documentsRouter };
