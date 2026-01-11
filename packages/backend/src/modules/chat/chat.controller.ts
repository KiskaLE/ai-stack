import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';

interface ChatRequestDto {
    message: string;
}

interface ChatResponseDto {
    text: string;
}

@Controller('api/chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
        if (!body.message || typeof body.message !== 'string') {
            throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const text = await this.chatService.chat(body.message);
            return { text };
        } catch (error) {
            console.error('Chat error:', error);
            throw new HttpException(
                'Failed to generate response',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
