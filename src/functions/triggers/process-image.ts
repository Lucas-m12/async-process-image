import { response } from "@/utils/response.js";
import type { S3Event } from "aws-lambda";

export const handler = async (event: S3Event) => {
  return response(200, { ok: true });
}
