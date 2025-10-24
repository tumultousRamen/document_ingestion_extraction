/*
Supports a single file upload to create a new broker object in the database. 
The document is stored as a document object in the database.
*/

import { randomUUID } from "node:crypto";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { putObject } from "~/foundations/aws/s3";
import { getTemporalClient } from "~/temporal/client";

const temporalClient = await getTemporalClient();

const brokerRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        file: z.instanceof(File),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { file } = input;

      const objectKey = `${randomUUID()}-${file.name}`;
      const buffer = await file.arrayBuffer();
      await putObject(objectKey, Buffer.from(buffer), file.type);

      // add document to database, kick off temporal workflow to extract broker information
      // workflow will then update the document to associate it to the broker record created from it

      const document = await ctx.db.document.create({
        data: {
          name: file.name,
          type: file.type,
          objectKey,
        },
      });

      
    }),
});
