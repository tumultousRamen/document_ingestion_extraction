/*
Supports a single file upload to create a new broker object in the database. 
The document is stored as a document object in the database.
*/

import { randomUUID } from "node:crypto";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { getPresignedUrls } from "~/foundations/aws/s3";
import { getTemporalClient } from "~/temporal/client";
import { processBroker } from "~/temporal/workflows/process";

const temporalClient = await getTemporalClient();

const brokerRouter = createTRPCRouter({
  getUploadUrl: publicProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name } = input;
      const objectKey = `${randomUUID()}-${name}`;
      const { PUT } = await getPresignedUrls({ key: objectKey });
      return { objectKey, url: PUT };
    }),
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(10),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      return ctx.db.broker.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }),
  getByDocumentId: publicProcedure
    .input(
      z.object({
        documentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { documentId } = input;
      return ctx.db.broker.findFirst({
        where: {
          documents: {
            some: { id: documentId },
          },
        },
      });
    }),
  create: publicProcedure
    .input(
      z.object({
        objectKey: z.string(),
        name: z.string(),
        type: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { objectKey, name, type } = input;

      // add document to database, kick off temporal workflow to extract broker information
      // workflow will then update the document to associate it to the broker record created from it

      const document = await ctx.db.document.create({
        data: {
          name,
          type,
          objectKey,
        },
      });

      await temporalClient.workflow.start(processBroker, {
        workflowId: `process-document-${document.id}`,
        taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "default",
        args: [{ document }],
      });

      return document;
    }),
});

export { brokerRouter };
