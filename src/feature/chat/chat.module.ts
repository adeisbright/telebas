import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';
import { AssistantModule } from '../assistant/assistant.module';

@Module({
  imports: [AssistantModule],
  providers: [ChatService, ConfigService],
  controllers: [ChatController],
})
export class ChatModule {}
