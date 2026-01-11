import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [CommonModule, HealthModule, ChatModule],
})
export class AppModule { }
