import { s3Client } from "@/clients/s3-client.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

export const getS3Object = async (
  { bucketName, objectKey }: GetS3ObjectInput
) => {
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey
  });
  const { Body } = await s3Client.send(getObjectCommand);
  if (!(Body instanceof Readable))
    throw new Error(`Cannot find file ${bucketName}/${objectKey}`);

  const chunks = [];
  for await (const chunk of Body) {
    chunks.push(chunk);
  }

  const file = Buffer.concat(chunks);
  return file;
};

interface GetS3ObjectInput {
  bucketName: string;
  objectKey: string;
}
