import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenRouter, OpenRouterProvider } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

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

    async chat(message: string): Promise<string> {
        const { text } = await generateText({
            model: this.openrouter.chat(this.model),
            prompt: message,
        });

        return text;
    }
}
