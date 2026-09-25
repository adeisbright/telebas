import { httpClient } from '@/shared/lib';
import { IEnvironmentVariables } from '@/shared/types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly telegramToken: string;
  private readonly telegramBaseUrl: string;
  private readonly chatId = '-717508955';
  constructor(
    private readonly configService: ConfigService<IEnvironmentVariables, true>,
  ) {
    this.telegramToken = this.configService.get<string>('telegramToken');
    this.telegramBaseUrl = this.configService.get<string>('telegramBaseUrl');
  }
  async messageTelegram(message: string, chatId?: number | string) {
    const entityId = chatId || this.chatId;
    const urlString = new URL(
      `${this.telegramBaseUrl}/bot${this.telegramToken}/sendMessage?chat_id=${entityId}&text=${message}`,
    );
    return await httpClient({
      url: urlString,
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });
  }

  async getTelegramBotInfo() {
    return await httpClient({
      url: `https://api.telegram.org/bot${this.telegramToken}/getMe`,
      headers: {
        'content-type': 'application/json',
      },
      method: 'GET',
    });
  }

  async getTelegramUpdate() {
    return await httpClient({
      url: `https://api.telegram.org/bot${this.telegramToken}/getUpdates`,
      headers: {
        'content-type': 'application/json',
      },
      method: 'GET',
    });
  }

  async registerWebhook() {
    const webhookBaseURL = 'https://9b28-102-88-104-184.ngrok-free.app';
    const telegramWebhook = `${webhookBaseURL}/v1/chats`;
    return await httpClient({
      url: `https://api.telegram.org/bot${this.telegramToken}/setWebhook`,
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      body: {
        url: telegramWebhook,
      },
    });
  }

  async getWebhookInfo() {
    return await httpClient({
      url: `https://api.telegram.org/bot${this.telegramToken}/getWebhookInfo`,
      headers: {
        'content-type': 'application/json',
      },
      method: 'GET',
    });
  }

  async processWebhook() {
    return await httpClient({
      url: `https://api.telegram.org/bot${this.telegramToken}/getUpdates`,
      headers: {
        'content-type': 'application/json',
      },
      method: 'GET',
    });
  }
}
