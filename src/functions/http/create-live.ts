import { dynamoClient } from '@/clients/dynamo-client.js';
import { env } from '@/config/env.js';
import { response } from '@/utils/response.js';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { randomUUID } from 'node:crypto';
import { z } from 'zod/mini';

export const handler = async (event: APIGatewayProxyEventV2) => {
  const body = JSON.parse(event.body ?? '{}');
  const { success, error, data } = schema.safeParse(body);
  if (!success) return response(400, { error: error.issues });
  const { number, title } = data;
  const liveId = randomUUID();
  const putItemCommand = new PutCommand({
    TableName: env.LIVES_TABLE,
    Item: {
      id: liveId,
      number,
      title,
    }
  });
  await dynamoClient.send(putItemCommand);
  return response(201, { liveId });
}

const schema = z.object({
  title: z.string().check(z.minLength(1)),
  number: z.number()
});
