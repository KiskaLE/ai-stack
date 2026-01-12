import { Controller, Post, Body, HttpException, HttpStatus, Res, UsePipes } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { createChatSchema } from './dto/create-chat.dto';
import type { CreateChatDto } from './dto/create-chat.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

interface ChatResponseDto {
    text: string;
}

@Controller('api/chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    @UsePipes(new ZodValidationPipe(createChatSchema))
    async chat(
        @Body() body: CreateChatDto,
        @Res() res: Response,
    ): Promise<void> {

        try {
            if (body.stream) {
                // Streaming response
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('Access-Control-Allow-Origin', '*');

                for await (const chunk of this.chatService.chatStream(body.messages, body.context)) {
                    console.log('Stream chunk:', chunk.type, chunk);
                    if (chunk.type === 'text-delta') {
                        res.write(`data: ${JSON.stringify({ type: 'text', text: chunk.textDelta })}\n\n`);
                    } else if (chunk.type === 'tool-call') {
                        res.write(`data: ${JSON.stringify({ type: 'tool-call', toolName: chunk.toolName, args: chunk.args })}\n\n`);
                    } else if (chunk.type === 'tool-result') {
                        res.write(`data: ${JSON.stringify({ type: 'tool-result', toolName: chunk.toolName, result: chunk.result })}\n\n`);
                    }
                }

                res.write('data: [DONE]\n\n');
                res.end();
            } else {
                // Non-streaming response
                const text = await this.chatService.chat(body.messages, body.context);
                res.json({ text });
            }
        } catch (error) {
            console.error('Chat error:', error);
            if (!res.headersSent) {
                throw new HttpException(
                    'Failed to generate response',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            res.end();
        }
    }
}
