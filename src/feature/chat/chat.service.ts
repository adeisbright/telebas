import { Injectable } from '@nestjs/common';
import { AssistantService } from '../assistant/assistant.service';
import { ITelegramWebhookMessage } from '@/shared/types/telegram';

@Injectable()
export class ChatService {
  constructor(private readonly assistantService: AssistantService) {}
  processPrompt(payload: ITelegramWebhookMessage) {
    return this.assistantService.subscriptionAdvisor(payload);
  }
}
