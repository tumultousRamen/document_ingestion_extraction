import "dotenv/config";
import { z } from "zod";

export const envResult = z
  .object({
    DATABASE_URL: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    ANTHROPIC_KEY: z.string(),
    REDUCTO_KEY: z.string(),
    S3_BUCKET_NAME: z.string(),
    S3_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    TEMPORAL_TLS_CLIENT_CERT: z.string(),
    TEMPORAL_TLS_CLIENT_KEY: z.string(),
    REDIS_URL: z.string(),
    BASE_URL: z.string(),
    BEDROCK_USER_ACCESS_KEY: z.string(),
    BEDROCK_USER_SECRET_KEY: z.string(),
    TEMPORAL_TASK_QUEUE: z.string(),
  })
  .safeParse(process.env);

if (!envResult.success) {
  console.error(envResult.error.format());
  process.exit(1);
}

export const env = envResult.data;
