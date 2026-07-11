import { response } from '@/utils/response.js';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEventV2) => {
  return response(201, { hello: 'lucas' });
}
