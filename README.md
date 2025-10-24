# Insurance Submission Ingestion - Local Setup

This app ingests broker correspondence and documents, extracts broker info and property addresses with LLM guardrails, and persists results. It uses Next.js (app router), tRPC, Prisma/Postgres, Temporal (workflows), and S3 for storage.

## Prerequisites

- Node.js 20+, pnpm 10+
- Docker (for Postgres and optional Temporal) or Postgres locally
- AWS S3 bucket and credentials (for file uploads)
- Temporal server (Docker or CLI)

## 1) Install dependencies

```
pnpm install
```

## 2) Environment variables

Create `.env.local` in the project root with at least:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/insurance_extraction
NODE_ENV=development

# LLM / Providers
ANTHROPIC_KEY=sk-ant-...
REDUCTO_KEY=...

# AWS / S3
S3_BUCKET_NAME=your-bucket
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_TASK_QUEUE=default-task-queue

# Misc
BASE_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
BEDROCK_USER_ACCESS_KEY=dummy
BEDROCK_USER_SECRET_KEY=dummy
```

Notes:

- Ensure your S3 bucket has CORS configured to allow browser PUT uploads from `http://localhost:3000`:

```
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## 3) Database

Start Postgres (choose one):

- Docker example (optional script not provided): run your own Postgres container on 5432
- Or local Postgres listening on `localhost:5432`

Generate Prisma client and apply schema:

```
pnpm postinstall # generates prisma client
pnpm db:generate  # prisma migrate dev (interactive)
```

To inspect data:

```
pnpm db:studio
```

## 4) Temporal server

Option A: Docker Compose

```
pnpm temporal:up
pnpm temporal:web # opens http://localhost:8233
```

Option B: Temporal CLI (no Docker)

```
brew install temporal
pnpm temporal:cli:start
open http://localhost:8233
```

## 5) Start the worker

In a separate terminal (keep running):

```
pnpm temporal:approve   # first run only (approve native builds)
pnpm temporal:worker    # polls TEMPORAL_TASK_QUEUE
```

If the worker crashes, verify `.env.local` has all required vars and that your S3/LLM keys are valid.

## 6) Start the Next.js app

```
pnpm dev
```

Visit `http://localhost:3000`.

## 7) Usage

1. Step 1: Upload the broker correspondence (email or PDF). The app uploads to S3 via a presigned URL and creates a `Document`. A Temporal workflow extracts broker fields.
2. Once the broker record appears (polled automatically), Step 2 unlocks. Upload up to 10 supporting documents. Temporal extracts property addresses and links them to the broker.

## Troubleshooting

- S3 upload fails with CORS/preflight errors: ensure the bucket CORS matches the block above and region/credentials are correct.
- Temporal workflows stuck in “No Workers Running”: start the worker (`pnpm temporal:worker`) and ensure the task queue matches `TEMPORAL_TASK_QUEUE`.
- Env import errors: this project uses `~/env.js` (Next.js runtime env) in most foundations. Ensure paths are correct and `tsconfig.json` path alias `~/*` resolves.
- Type errors/lint: `pnpm typecheck` and `pnpm lint`.

## Scripts

- `pnpm dev` - start Next.js dev server
- `pnpm typecheck` - TypeScript check
- `pnpm lint` / `pnpm lint:fix` - ESLint
- `pnpm postinstall` - Prisma generate
- `pnpm db:generate` - `prisma migrate dev`
- `pnpm db:migrate` - deploy migrations
- `pnpm db:studio` - Prisma Studio
- `pnpm temporal:up` / `pnpm temporal:down` / `pnpm temporal:web`
- `pnpm temporal:cli:start` - Temporal dev server (no Docker)
- `pnpm temporal:worker` - run worker
