import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { APP_FILTER } from '@nestjs/core';
import { ErrorInterceptor } from '@/shared/errors/error-interceptor';
import { AssistantModule } from './assistant/assistant.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [ChatModule, AssistantModule, TelegramModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ErrorInterceptor,
    },
  ],
  controllers: [],
})
export class FeatureModule {}
