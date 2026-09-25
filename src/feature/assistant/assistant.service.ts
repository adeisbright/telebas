import { IEnvironmentVariables } from '@/shared/types';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  predictionJsonResponseSchema,
  predictionResponseSchema,
} from './response.schema';
import { TelegramService } from '../telegram/telegram.service';
import { Paystack } from '../payment/paystack';
import { ITelegramWebhookMessage } from '@/shared/types/telegram';

@Injectable()
export class AssistantService {
  private readonly ai: GoogleGenAI;
  private readonly aiModel: string;
  private readonly logger = new Logger(AssistantService.name);
  constructor(
    private readonly configService: ConfigService<IEnvironmentVariables, true>,
    private readonly telegramService: TelegramService,
    private readonly paystackService: Paystack,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: this.configService.get<string>('geminiKey'),
    });
    this.aiModel = this.configService.get<string>('geminiModel');
  }

  private listPlans() {
    return {
      type: 'function',
      description: 'List Plans on Paystack',
      name: 'listPlan',
    } as const;
  }

  private getPlan() {
    return {
      type: 'function',
      description: 'List Plans on Paystack',
      name: 'getPlan',
      parameters: {
        type: 'object',
        properties: {
          planCode: {
            type: 'string',
            description: 'The id or code for the subscription plan',
          },
        },
        required: ['planCode'],
      },
    } as const;
  }

  /**
   * TODO
   * 1. Store Webhook Messages from Telegram to avoid duplicate
   * 2. Reject or Don't Process Acknowledged Webhook
   * 3. Log Every Request for Observability Purpose
   * 4. Log Every Prompt , The Response and Setup a Way to Evaluate
   *
   */
  async subscriptionAdvisor(payload: ITelegramWebhookMessage) {
    const {
      message: { chat, text: prompt },
    } = payload;
    const chatId = chat.id;
    try {
      this.logger.log('Responding to Message from Telegram');
      //Setup Prompt Controls and Message Response Target
      const systemInstructions = `
      Do Not Process Any prompt that is 
      not related to paystack subscriptions.
      For any of such prompt. Respond with: 
      Please, contact support
      `;
      const functionCalls = [this.listPlans(), this.getPlan()];

      this.logger.log('Interacting with Gemini for', prompt);
      //Interact with Gemini
      const interaction = await this.ai.interactions.create({
        model: this.aiModel,
        input: prompt,
        tools: functionCalls,
        system_instruction: systemInstructions,
      });
      //Check for Called Tools
      const fcStep: any = interaction.steps.find(
        (s) => s.type === 'function_call',
      );

      if (!fcStep) {
        this.logger.error('No Function Was Called for this Prompt');
        this.telegramService.messageTelegram(
          'Sorry, we currently do not have a response now',
          chatId,
        );
      }
      let result;
      if (fcStep.name === 'listPlan') {
        result = await this.paystackService.listPlans();
        this.logger.log(`Function execution result: ${JSON.stringify(result)}`);
      }

      if (fcStep.name === 'getPlan') {
        result = await this.paystackService.fetchPlanData(
          fcStep.arguments.planCode,
        );
        this.logger.log(`Function execution result: ${JSON.stringify(result)}`);
      }

      //Call for the Final Interaction
      const finalInteraction = await this.ai.interactions.create({
        model: this.aiModel,
        input: [
          {
            type: 'function_result',
            name: fcStep.name,
            call_id: fcStep.id,
            result: [{ type: 'text', text: JSON.stringify(result) }],
          },
        ],
        tools: functionCalls,
        previous_interaction_id: interaction.id,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: predictionJsonResponseSchema,
        },
        system_instruction: systemInstructions,
      });

      //Confirm the Response Format is Correct
      const responseData = predictionResponseSchema.parse(
        JSON.parse(finalInteraction.output_text as string),
      );
      //Send Response to User on Telegram
      return this.telegramService.messageTelegram(
        JSON.stringify(responseData),
        chatId,
      );
    } catch (err) {
      this.logger.error(
        'Failed to process subscription request',
        err instanceof Error ? err.stack : String(err),
      );
      this.telegramService.messageTelegram(
        'Sorry, we encountered an error',
        chatId,
      );
    }
  }
}
