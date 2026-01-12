import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { McpService } from './mcp.service';

@Module({
    controllers: [ChatController],
    providers: [ChatService, McpService],
    exports: [ChatService, McpService],
})
export class ChatModule { }
