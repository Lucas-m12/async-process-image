import { type APIGatewayProxyEventV2 } from 'aws-lambda';
import { response } from '../utils/response.js';

export const handler = async (event: APIGatewayProxyEventV2) => {
  return response(201, { hello: 'lucas' });
}
