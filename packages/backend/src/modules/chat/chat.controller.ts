import { Controller, Post, Body, HttpException, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';

interface ChatRequestDto {
    message: string;
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
        if (!body.message || typeof body.message !== 'string') {
            throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
        }

        try {
            if (body.stream) {
                // Streaming response
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('Access-Control-Allow-Origin', '*');

                for await (const chunk of this.chatService.chatStream(body.message)) {
                    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                }

                res.write('data: [DONE]\n\n');
                res.end();
            } else {
                // Non-streaming response
                const text = await this.chatService.chat(body.message);
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
