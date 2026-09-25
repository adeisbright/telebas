jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { ITelegramWebhookMessage } from '@/shared/types/telegram';
import { AssistantService } from '../assistant/assistant.service';
import { ChatService } from './chat.service';

const webhook = (): ITelegramWebhookMessage => ({
  update_id: 1,
  message: {
    message_id: 10,
    from: {
      id: 99,
      is_bot: false,
      first_name: 'Ada',
      language_code: 'en',
    },
    chat: {
      id: 99,
      first_name: 'Ada',
      type: 'private',
    },
    date: 1700000000,
    text: 'What plans do you have?',
  },
});

describe('ChatService', () => {
  it('forwards the webhook to the subscription advisor', async () => {
    const payload = webhook();
    const assistant = {
      subscriptionAdvisor: jest.fn().mockResolvedValue({ ok: true }),
    };
    const service = new ChatService(assistant as unknown as AssistantService);

    await expect(service.processPrompt(payload)).resolves.toEqual({
      ok: true,
    });
    expect(assistant.subscriptionAdvisor).toHaveBeenCalledWith(payload);
  });
});
