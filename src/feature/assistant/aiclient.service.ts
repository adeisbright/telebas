import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import { IEnvironmentVariables } from '@/shared/types';

@Injectable()
export class AiClient {
  private readonly logger = new Logger(AiClient.name);

  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService<IEnvironmentVariables, true>,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: this.configService.get<string>('geminiKey'),
    });

    this.model = this.configService.get<string>('geminiModel');
  }

  async createInteraction(params: {
    input: string | unknown[];
    tools?: readonly unknown[];
    systemInstruction: string;
    previousInteractionId?: string;
    responseFormat?: unknown;
  }) {
    this.logger.debug('Creating Gemini interaction');

    return this.ai.interactions.create({
      model: this.model,
      input: params.input as any,
      tools: params.tools as any,
      system_instruction: params.systemInstruction,
      previous_interaction_id: params.previousInteractionId,
      response_format: params.responseFormat as any,
    });
  }
}
