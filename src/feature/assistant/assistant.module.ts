import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';
import { TelegramModule } from '../telegram/telegram.module';
import { Paystack } from '../payment/paystack';

@Module({
  imports: [TelegramModule],
  providers: [AssistantService, ConfigService, Paystack, TelegramService],
  exports: [AssistantService],
})
export class AssistantModule {}
