jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { httpClient } from '@/shared/lib';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';

jest.mock('@/shared/lib', () => ({
  httpClient: jest.fn(),
}));

describe('TelegramService', () => {
  const token = '123:abc';
  const baseUrl = 'https://api.telegram.org';
  let telegram: TelegramService;

  beforeEach(async () => {
    jest.mocked(httpClient).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'telegramToken') {
                return token;
              }
              if (key === 'telegramBaseUrl') {
                return baseUrl;
              }
              return undefined;
            },
          },
        },
      ],
    }).compile();

    telegram = module.get(TelegramService);
  });

  const request = () => jest.mocked(httpClient).mock.calls[0][0];

  it('sends a message to the default chat', async () => {
    jest.mocked(httpClient).mockResolvedValueOnce({ ok: true });

    await telegram.messageTelegram('hello world');

    const url = new URL(String(request().url));
    expect(`${url.origin}${url.pathname}`).toBe(
      `${baseUrl}/bot${token}/sendMessage`,
    );
    expect(url.searchParams.get('chat_id')).toBe('-717508955');
    expect(url.searchParams.get('text')).toBe('hello world');
    expect(request().method).toBe('POST');
    expect(request().headers).toEqual({
      'content-type': 'application/json',
    });
  });

  it('sends a message to an explicit chat id', async () => {
    jest.mocked(httpClient).mockResolvedValueOnce({ ok: true });

    await telegram.messageTelegram('plans', 42);

    const url = new URL(String(request().url));
    expect(url.searchParams.get('chat_id')).toBe('42');
    expect(url.searchParams.get('text')).toBe('plans');
  });

  it('loads bot info', async () => {
    const info = { ok: true, result: { username: 'telebas_bot' } };
    jest.mocked(httpClient).mockResolvedValueOnce(info);

    await expect(telegram.getTelegramBotInfo()).resolves.toEqual(info);
    expect(String(request().url)).toBe(
      `https://api.telegram.org/bot${token}/getMe`,
    );
    expect(request().method).toBe('GET');
  });

  it('loads updates', async () => {
    jest.mocked(httpClient).mockResolvedValueOnce({ ok: true, result: [] });

    await telegram.getTelegramUpdate();

    expect(String(request().url)).toBe(
      `https://api.telegram.org/bot${token}/getUpdates`,
    );
    expect(request().method).toBe('GET');
  });

  it('registers the chat webhook', async () => {
    jest.mocked(httpClient).mockResolvedValueOnce({ ok: true });

    await telegram.registerWebhook();

    expect(String(request().url)).toBe(
      `https://api.telegram.org/bot${token}/setWebhook`,
    );
    expect(request().method).toBe('POST');
    expect(request().body).toEqual({
      url: 'https://9b28-102-88-104-184.ngrok-free.app/v1/chats',
    });
  });

  it('loads webhook info', async () => {
    const info = { ok: true, result: { url: 'https://example.com/v1/chats' } };
    jest.mocked(httpClient).mockResolvedValueOnce(info);

    await expect(telegram.getWebhookInfo()).resolves.toEqual(info);
    expect(String(request().url)).toBe(
      `https://api.telegram.org/bot${token}/getWebhookInfo`,
    );
  });

  it('processes webhook updates through getUpdates', async () => {
    jest.mocked(httpClient).mockResolvedValueOnce({ ok: true, result: [] });

    await telegram.processWebhook();

    expect(String(request().url)).toBe(
      `https://api.telegram.org/bot${token}/getUpdates`,
    );
    expect(request().method).toBe('GET');
  });
});
