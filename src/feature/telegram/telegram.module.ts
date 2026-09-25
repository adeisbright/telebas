import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [TelegramService, ConfigService],
})
export class TelegramModule {}
