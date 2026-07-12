import { getS3Object } from "@/utils/get-s3-object.js";
import { response } from "@/utils/response.js";
import type { S3Event } from "aws-lambda";

export const handler = async (event: S3Event) => {
  const promises = event.Records.map(async (record) => {
    const file = await getS3Object(
      { bucketName: record.s3.bucket.name,  objectKey: record.s3.object.key}
    );
  });
  await Promise.all(promises);
  return response(200, { ok: true });
}
