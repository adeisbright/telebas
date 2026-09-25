import { AssistantService } from '@/feature/assistant/assistant.service';
import { FeatureModule } from '@/feature/feature.module';
import { INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

const webhook = (overrides: Record<string, unknown> = {}) => ({
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
  ...overrides,
});

describe('Chat webhook (integration)', () => {
  let app: INestApplication;
  const assistant = {
    subscriptionAdvisor: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FeatureModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          const values: Record<string, string> = {
            geminiKey: 'test-gemini-key',
            geminiModel: 'test-gemini-model',
            paystackSecretKey: 'sk_test',
            paystackTransactionUrl: 'https://api.paystack.co',
            telegramToken: '123:abc',
            telegramBaseUrl: 'https://api.telegram.org',
          };
          return values[key];
        },
      })
      .overrideProvider(AssistantService)
      .useValue(assistant)
      .compile();

    app = moduleFixture.createNestApplication({ logger: false });
    app.enableVersioning({
      type: VersioningType.URI,
    });
    await app.init();
  });

  beforeEach(() => {
    assistant.subscriptionAdvisor.mockReset();
    assistant.subscriptionAdvisor.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/chats', () => {
    it('acknowledges a valid Telegram webhook and forwards it', async () => {
      const payload = webhook();

      const response = await request(app.getHttpServer())
        .post('/v1/chats')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Webook message acknowledged',
      });
      expect(assistant.subscriptionAdvisor).toHaveBeenCalledWith(payload);
    });

    it('rejects a webhook that is missing the message text', async () => {
      const payload = webhook();
      delete (payload.message as { text?: string }).text;

      const response = await request(app.getHttpServer())
        .post('/v1/chats')
        .send(payload);

      expect(response.status).toBe(400);
      expect(assistant.subscriptionAdvisor).not.toHaveBeenCalled();
    });

    it('rejects an empty body', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/chats')
        .send({});

      expect(response.status).toBe(400);
      expect(assistant.subscriptionAdvisor).not.toHaveBeenCalled();
    });
  });
});
