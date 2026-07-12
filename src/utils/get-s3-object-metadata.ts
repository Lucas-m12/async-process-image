import { s3Client } from "@/clients/s3-client.js";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

export const getS3ObjectMetadata = async (
  { bucketName, objectKey }: GetS3ObjectMetadataInput
) => {
  const headObjectCommand = new HeadObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });
  const { Metadata = {} } = await s3Client.send(headObjectCommand);
  return { metadata: Metadata };
};

interface GetS3ObjectMetadataInput {
  bucketName: string;
  objectKey: string;
}
