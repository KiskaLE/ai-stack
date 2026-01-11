import { Controller, Post, Body, HttpException, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService, ChatMessage } from './chat.service';

interface ChatRequestDto {
    messages: ChatMessage[];
    stream?: boolean;
}

interface ChatResponseDto {
    text: string;
}

@Controller('api/chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    async chat(
        @Body() body: ChatRequestDto,
        @Res() res: Response,
    ): Promise<void> {
        if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
            throw new HttpException('Messages array is required', HttpStatus.BAD_REQUEST);
        }

        try {
            if (body.stream) {
                // Streaming response
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('Access-Control-Allow-Origin', '*');

                for await (const chunk of this.chatService.chatStream(body.messages)) {
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
                const text = await this.chatService.chat(body.messages);
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
