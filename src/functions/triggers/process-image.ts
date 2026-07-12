import { dynamoClient } from "@/clients/dynamo-client.js";
import { s3Client } from "@/clients/s3-client.js";
import { env } from "@/config/env.js";
import { extractFileInfo } from "@/utils/extract-file-info.js";
import { getS3ObjectMetadata } from "@/utils/get-s3-object-metadata.js";
import { getS3Object } from "@/utils/get-s3-object.js";
import { response } from "@/utils/response.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { S3Event } from "aws-lambda";
import sharp from "sharp";

export const handler = async (event: S3Event) => {
  const promises = event.Records.map(async (record) => {
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;


    const [file, { metadata }] = await Promise.all([
      getS3Object({ bucketName, objectKey }),
      getS3ObjectMetadata({ bucketName, objectKey }),
    ]);
    const liveId = metadata.liveid;
    if (!liveId) return;

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
      Metadata: {
        liveid: liveId
      }
    });
    const sdPutObject = new PutObjectCommand({
      Bucket: bucketName,
      Key: sdThumbnailKey,
      Body: sdImage,
      Metadata: {
        liveid: liveId
      }
    });
    const placeholderPutObject = new PutObjectCommand({
      Bucket: bucketName,
      Key: placeholderThumbnailKey,
      Body: placeholderImage,
      Metadata: {
        liveid: liveId
      }
    });

    const updateCommand = new UpdateCommand({
      TableName: env.LIVES_TABLE,
      Key: {
        id: liveId,
      },
      UpdateExpression: 'set #hdThumbnailKey = :hdThumbnailKey, #sdThumbnailKey = :sdThumbnailKey, #placeholderThumbnailKey = :placeholderThumbnailKey',
      ExpressionAttributeNames: {
        '#hdThumbnailKey': 'hdThumbnailKey',
        '#sdThumbnailKey': 'sdThumbnailKey',
        '#placeholderThumbnailKey': 'placeholderThumbnailKey',
      },
      ExpressionAttributeValues: {
        ':hdThumbnailKey': hdThumbnailKey,
        ':sdThumbnailKey': sdThumbnailKey,
        ':placeholderThumbnailKey': placeholderThumbnailKey,
      }
    });

    await Promise.all([
      dynamoClient.send(updateCommand),
      s3Client.send(hdPutObject),
      s3Client.send(sdPutObject),
      s3Client.send(placeholderPutObject),
    ])
  });
  await Promise.all(promises);
  return response(200, { ok: true });
}
