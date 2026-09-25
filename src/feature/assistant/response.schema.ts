import * as z from 'zod';
import { JSONSchema } from 'zod/v4/core';

export const predictionJsonResponseSchema: JSONSchema.JSONSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', description: 'Success or error status' },
    summary: {
      type: 'string',
      description: 'summary of the response',
    },
  },
  required: ['status', 'summary'],
};
export const predictionResponseSchema = z.fromJSONSchema(
  predictionJsonResponseSchema,
);
