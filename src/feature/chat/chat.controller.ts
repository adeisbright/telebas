import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ZodValidationPipe } from '@/shared/lib/zod-validation-pipe';
import { createPromptSchema } from './pipe/create-prompt';
import { ITelegramWebhookMessage } from '@/shared/types/telegram';

@Controller({
  version: '1',
  path: 'chats',
})
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  handlePrompt(
    @Body(new ZodValidationPipe(createPromptSchema))
    payload: ITelegramWebhookMessage,
  ) {
    console.log('Webhook Called');
    this.chatService.processPrompt(payload);
    return {
      message: 'Webook message acknowledged',
    };
  }
}
