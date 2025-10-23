import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
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
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    ANTHROPIC_KEY: process.env.ANTHROPIC_KEY,
    REDUCTO_KEY: process.env.REDUCTO_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_REGION: process.env.S3_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    TEMPORAL_TLS_CLIENT_CERT: process.env.TEMPORAL_TLS_CLIENT_CERT,
    TEMPORAL_TLS_CLIENT_KEY: process.env.TEMPORAL_TLS_CLIENT_KEY,
    REDIS_URL: process.env.REDIS_URL,
    BASE_URL: process.env.BASE_URL,
    BEDROCK_USER_ACCESS_KEY: process.env.BEDROCK_USER_ACCESS_KEY,
    BEDROCK_USER_SECRET_KEY: process.env.BEDROCK_USER_SECRET_KEY,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
