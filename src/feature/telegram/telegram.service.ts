import { httpClient } from '@/shared/lib';
import { IEnvironmentVariables } from '@/shared/types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly telegramToken: string;
  private readonly telegramBaseUrl: string;
  private readonly telegramChatId: string;
  constructor(
    private readonly configService: ConfigService<IEnvironmentVariables, true>,
  ) {
    this.telegramToken = this.configService.get<string>('telegramToken');
    this.telegramBaseUrl = this.configService.get<string>('telegramBaseUrl');
    this.telegramChatId = this.configService.get<string>('telegramChatId');
  }
  async messageTelegram(message: string, chatId?: number | string) {
    const entityId = chatId || this.telegramChatId;
    const botMessagePath = `${this.telegramBaseUrl}/bot${this.telegramToken}`;
    const urlString = new URL(
      `${botMessagePath}/sendMessage?chat_id=${entityId}&text=${message}`,
    );
    return await httpClient({
      url: urlString,
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });
  }
}
