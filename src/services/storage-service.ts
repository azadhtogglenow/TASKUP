import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "../config/s3.js";
import { logger } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

export class StorageService {
  private static client: S3Client = s3Client;
  private static bucket: string = S3_BUCKET;

  static async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string
  ): Promise<string> {
    const documentId = uuidv4();
    const s3Key = `documents/${documentId}/${filename}`;

    logger.info(`Uploading to S3: ${s3Key}`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: mimetype,
        })
      );

      logger.info(` Upload successful: ${s3Key}`);
      return s3Key;
    } catch (error) {
      logger.error(` Upload failed: ${error}`);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }


static async downloadFile(s3Key: string): Promise<Buffer> {
  logger.info(`Downloading from S3: ${s3Key}`);

  try {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      })
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error("Empty response body");
    }

    const buffer = Buffer.from(bytes);
    const fileHead = buffer.subarray(0, 10).toString("utf-8").trim();
    if (fileHead.startsWith("<") || fileHead.toLowerCase().includes("xml")) {
      const storageErrorRaw = buffer.subarray(0, 500).toString("utf-8").trim();
      const errorCodeMatch = storageErrorRaw.match(/<Code>(.*?)<\/Code>/);
      const errorCode = errorCodeMatch ? errorCodeMatch[1] : "StorageServerError";

      logger.error(`Intercepted storage error text instead of binary file! Code: ${errorCode}`);
      throw new Error(`STORAGE_SERVER_FAULT (${errorCode}): The file retrieved is an XML error page. Full payload: ${storageErrorRaw}`);
    }

    logger.info(`Download successful: ${buffer.length} bytes`);
    return buffer;
  } catch (error: any) {
    logger.error(`Download failed: ${error.message || error}`);
    throw error;
  }
}


  static async deleteFile(s3Key: string): Promise<void> {
    logger.info(`Deleting from S3: ${s3Key}`);

    try {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        })
      );
      logger.info(` Delete successful: ${s3Key}`);
    } catch (error) {
      logger.error(` Delete failed: ${error}`);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  static async ensureBucket(): Promise<void> {
    const { CreateBucketCommand, HeadBucketCommand } = await import("@aws-sdk/client-s3");

    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.bucket })
      );
      logger.info(`Bucket "${this.bucket}" already exists`);
    } catch (error) {
      logger.info(`Creating bucket: ${this.bucket}`);
      await this.client.send(
        new CreateBucketCommand({ Bucket: this.bucket })
      );
      logger.info(`Bucket "${this.bucket}" created`);
    }
  }
}