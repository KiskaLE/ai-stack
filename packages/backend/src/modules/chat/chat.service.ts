import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenRouter, OpenRouterProvider } from '@openrouter/ai-sdk-provider';
import { streamText, generateText, CoreMessage } from 'ai';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

@Injectable()
export class ChatService {
    private openrouter: OpenRouterProvider;
    private model: string;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('openrouter.apiKey');
        this.model = this.configService.get<string>('openrouter.model') || 'anthropic/claude-3.5-sonnet';

        if (!apiKey) {
            console.warn('OPENROUTER_API_KEY is not set');
        }

        this.openrouter = createOpenRouter({
            apiKey: apiKey || '',
        });
    }

    async chat(messages: ChatMessage[]): Promise<string> {
        const { text } = await generateText({
            model: this.openrouter.chat(this.model),
            messages: this.toCoreMessages(messages),
        });

        return text;
    }

    async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
        const result = streamText({
            model: this.openrouter.chat(this.model),
            messages: this.toCoreMessages(messages),
        });

        for await (const chunk of result.textStream) {
            yield chunk;
        }
    }

    private toCoreMessages(messages: ChatMessage[]): CoreMessage[] {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content,
        }));
    }
}
