import { S3Client } from "@aws-sdk/client-s3";

export const AWS_REGION = process.env.AWS_REGION || "ap-southeast-2";
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "pickle-art-s3-storage";

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Stable, publicly-accessible app URL for an object.
 * The bucket is private (static S3 URLs return 403), so media is served through
 * the /api/media proxy which streams objects using server credentials.
 */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}
