import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';

import { ITelegramWebhookMessage } from '@/shared/types/telegram';
import { AiClient } from './aiclient.service';
import { ToolExecutor } from './toolexecutor';
import { ResponseValidator } from './response.validator';

@Injectable()
export class AssistantServiceV2 {
  private readonly logger = new Logger(AssistantServiceV2.name);

  private readonly systemInstruction = `
    You are a Paystack subscription assistant.

    Only process requests related to Paystack subscriptions.

    If a request is unrelated to Paystack subscriptions,
    respond with:
    "Please, contact support"
    `;

  constructor(
    private readonly aiClient: AiClient,
    private readonly toolExecutor: ToolExecutor,
    private readonly responseValidator: ResponseValidator,
    private readonly telegramService: TelegramService,
  ) {}

  async subscriptionAdvisor(payload: ITelegramWebhookMessage) {
    const {
      message: { chat, text: prompt },
    } = payload;

    try {
      this.logger.log(`Processing subscription request for chat ${chat.id}`);

      const tools = this.toolExecutor.getDefinitions();

      // 1. Ask AI what it wants to do
      const interaction = await this.aiClient.createInteraction({
        input: prompt,
        tools,
        systemInstruction: this.systemInstruction,
      });

      // 2. Find tool call
      const toolCall = interaction.steps.find(
        (step) => step.type === 'function_call',
      );

      if (!toolCall || toolCall.type !== 'function_call') {
        return this.sendFallback(chat.id);
      }

      // 3. Execute application tool
      const result = await this.toolExecutor.execute(
        toolCall.name,
        toolCall.arguments,
      );

      // 4. Give tool result back to AI
      const finalInteraction = await this.aiClient.createInteraction({
        input: [
          {
            type: 'function_result',
            name: toolCall.name,
            call_id: toolCall.id,
            result: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          },
        ],
        tools,
        previousInteractionId: interaction.id,
        responseFormat: this.responseValidator.getResponseFormat(),
        systemInstruction: this.systemInstruction,
      });

      // 5. Validate AI response
      const response = this.responseValidator.validate(
        finalInteraction.output_text as string,
      );

      // 6. Send response to Telegram
      return this.telegramService.messageTelegram(
        JSON.stringify(response),
        chat.id,
      );
    } catch (error) {
      this.logger.error(
        'Failed to process subscription request',
        error instanceof Error ? error.stack : String(error),
      );

      return this.sendFallback(chat.id);
    }
  }

  private sendFallback(chatId: number) {
    return this.telegramService.messageTelegram(
      'Sorry, we currently do not have a response now.',
      chatId,
    );
  }
}
