import { s3Client } from "@/clients/s3-client.js";
import { extractFileInfo } from "@/utils/extract-file-info.js";
import { getS3Object } from "@/utils/get-s3-object.js";
import { response } from "@/utils/response.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import sharp from "sharp";

export const handler = async (event: S3Event) => {
  const promises = event.Records.map(async (record) => {
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;

    const file = await getS3Object(
      { bucketName, objectKey }
    );
    const [hdImage, sdImage, placeholderImage] = await Promise.all([
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

    const { filename } = extractFileInfo(objectKey);
    const hdThumbnailKey = `processed/${filename}_hd.webp`
    const sdThumbnailKey = `processed/${filename}_sd.webp`
    const placeholderThumbnailKey = `processed/${filename}_placeholder.webp`

    const hdPutObject = new PutObjectCommand({
      Bucket: bucketName,
      Key: hdThumbnailKey,
      Body: hdImage,
    });
    const sdPutObject = new PutObjectCommand({
      Bucket: bucketName,
      Key: sdThumbnailKey,
      Body: sdImage,
    });
    const placeholderPutObject = new PutObjectCommand({
      Bucket: bucketName,
      Key: placeholderThumbnailKey,
      Body: placeholderImage,
    });

    await Promise.all([
      s3Client.send(hdPutObject),
      s3Client.send(sdPutObject),
      s3Client.send(placeholderPutObject),
    ])
  });
  await Promise.all(promises);
  return response(200, { ok: true });
}
