import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { env } from "./environ";

const s3 = new S3Client({
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

async function main() {
  console.log("🔍 Checking S3 connectivity...");
  console.log("Region:", env.S3_REGION);
  console.log("Bucket:", env.S3_BUCKET_NAME);

  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET_NAME }));
    console.log(`✅ HeadBucket succeeded for "${env.S3_BUCKET_NAME}"`);

    const list = await s3.send(
      new ListObjectsV2Command({ Bucket: env.S3_BUCKET_NAME, MaxKeys: 5 }),
    );
    const names = (list.Contents ?? []).map((o) => o?.Key).filter(Boolean);
    console.log("✅ ListObjectsV2 succeeded. Sample keys:", names);

    console.log("🎉 S3 connection looks good!");
  } catch (err: unknown) {
    const e = err as {
      name?: string;
      message?: string;
      $metadata?: { httpStatusCode?: number };
    };
    console.error("❌ S3 check failed.");
    console.error("Name:", e?.name);
    console.error("Message:", e?.message);
    if (e?.$metadata?.httpStatusCode)
      console.error("Status:", e.$metadata.httpStatusCode);
    process.exit(1);
  }
}

await main();
