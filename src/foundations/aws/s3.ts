import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/environ.js";

export const s3Client = new S3Client({
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_BUCKET_NAME = env.S3_BUCKET_NAME;

type HeadResult = {
  exists: boolean;
  contentType?: string;
  contentLength?: number;
};

type S3SignedURLs = {
  GET: string;
  PUT: string;
};

export async function headObject(
  key: string,
  bucket: string = S3_BUCKET_NAME,
): Promise<HeadResult> {
  try {
    const res = await s3Client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      exists: true,
      contentType: res.ContentType,
      contentLength: res.ContentLength,
    };
  } catch (err) {
    const e = err as S3ServiceException & {
      $metadata?: { httpStatusCode?: number };
    };
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === "NotFound") {
      return { exists: false };
    }
    throw err;
  }
}

export async function putObject(
  key: string,
  body: string | Uint8Array | Buffer,
  contentType?: string,
  bucket: string = S3_BUCKET_NAME,
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getObjectText(
  key: string,
  bucket: string = S3_BUCKET_NAME,
): Promise<string> {
  const res = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!res.Body) return "";
  return await res.Body.transformToString("utf-8");
}

export async function getObjectBuffer(
  key: string,
  bucket: string = S3_BUCKET_NAME,
): Promise<Buffer> {
  const res = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!res.Body) return Buffer.alloc(0);
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function listObjects(
  prefix: string,
  bucket: string = S3_BUCKET_NAME,
  maxKeys = 1000,
): Promise<string[]> {
  const res = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    }),
  );
  return (res.Contents ?? []).map((o) => o.Key).filter(Boolean) as string[];
}

export async function deleteObject(
  key: string,
  bucket: string = S3_BUCKET_NAME,
): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export const getPresignedUrls = async ({
  key,
  bucket = S3_BUCKET_NAME,
  expiresIn = 86400, // 1 day in seconds
}: {
  key: string;
  bucket?: string;
  expiresIn?: number;
}): Promise<S3SignedURLs> => {
  const getCmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const get = await getSignedUrl(s3Client, getCmd, {
    expiresIn: expiresIn,
  });

  const putCmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const put = await getSignedUrl(s3Client, putCmd, {
    expiresIn: expiresIn,
  });

  return { GET: get, PUT: put };
};
