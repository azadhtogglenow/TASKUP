import { S3Client } from "@aws-sdk/client-s3";
import { config } from "./index";

export const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  region: config.s3.region,
  forcePathStyle: config.s3.forcePathStyle === true || String(config.s3.forcePathStyle) === "true" || true,
});
export const S3_BUCKET = config.s3.bucket;