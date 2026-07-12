import { getS3Object } from "@/utils/get-s3-object.js";
import { response } from "@/utils/response.js";
import type { S3Event } from "aws-lambda";
import sharp from "sharp";

export const handler = async (event: S3Event) => {
  const promises = event.Records.map(async (record) => {
    const file = await getS3Object(
      { bucketName: record.s3.bucket.name,  objectKey: record.s3.object.key}
    );
    const [hdFile, sdImage, placeholderImage] = await Promise.all([
      sharp(file)
        .resize({
          width: 1280,
          height: 720,
          fit: 'contain',
          background: '#000',
        })
        .toFormat('webp', { quality: 80 })
        .toBuffer(),
      sharp(file)
        .resize({
          width: 640,
          height: 360,
          fit: 'contain',
          background: '#000',
        })
        .toFormat('webp', { quality: 80 })
        .toBuffer(),
      sharp(file)
        .resize({
          width: 124,
          height: 70,
          fit: 'contain',
          background: '#000',
        })
        .toFormat('webp', { quality: 80 })
        .blur(5)
        .toBuffer(),

    ]);
  });
  await Promise.all(promises);
  return response(200, { ok: true });
}
