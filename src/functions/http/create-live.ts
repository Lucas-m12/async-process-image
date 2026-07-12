import { dynamoClient } from '@/clients/dynamo-client.js';
import { s3Client } from '@/clients/s3-client.js';
import { env } from '@/config/env.js';
import { extractFileInfo } from '@/utils/extract-file-info.js';
import { response } from '@/utils/response.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { randomUUID } from 'node:crypto';
import { z } from 'zod/mini';

export const handler = async (event: APIGatewayProxyEventV2) => {
  const body = JSON.parse(event.body ?? '{}');
  const { success, error, data } = schema.safeParse(body);
  if (!success) return response(400, { error: error.issues });

  const { number, title, filename } = data;
  const { extension } = extractFileInfo(filename);
  const liveId = randomUUID();
  const thumbnailKey = `uploads/${randomUUID()}.${extension}`;

  const putItemCommand = new PutCommand({
    TableName: env.LIVES_TABLE,
    Item: {
      id: liveId,
      number,
      title,
      thumbnailKey
    }
  });

  const putObjectCommand = new PutObjectCommand({
    Bucket: env.LIVES_IMAGES_BUCKET,
    Key: thumbnailKey,
    Metadata: {
      liveid: liveId,
    }
  });
  const uploadUrl = await getSignedUrl(
    s3Client, putObjectCommand, { expiresIn: 600 }
  );
  await dynamoClient.send(putItemCommand);

  return response(201, { liveId, uploadUrl });
}

const schema = z.object({
  title: z.string().check(z.minLength(1)),
  number: z.number(),
  filename: z.string().check(z.minLength(1)),
});
