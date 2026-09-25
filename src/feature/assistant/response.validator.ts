import { Injectable } from '@nestjs/common';
import {
  predictionJsonResponseSchema,
  predictionResponseSchema,
} from './response.schema';

@Injectable()
export class ResponseValidator {
  validate(rawOutput: string) {
    const json = JSON.parse(rawOutput);

    return predictionResponseSchema.parse(json);
  }

  getResponseFormat() {
    return {
      type: 'text',
      mime_type: 'application/json',
      schema: predictionJsonResponseSchema,
    } as const;
  }
}
