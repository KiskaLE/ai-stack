import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenRouter, OpenRouterProvider } from '@openrouter/ai-sdk-provider';
import { streamText, generateText, CoreMessage } from 'ai';
import { tools as localTools } from './tools';
import { McpService } from './mcp.service';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

@Injectable()
export class ChatService {
    private openrouter: OpenRouterProvider;
    private model: string;

    constructor(
        private configService: ConfigService,
        private mcpService: McpService
    ) {
        const apiKey = this.configService.get<string>('openrouter.apiKey');
        this.model = this.configService.get<string>('openrouter.model') || 'anthropic/claude-3.5-sonnet';

        if (!apiKey) {
            console.warn('OPENROUTER_API_KEY is not set');
        }

        this.openrouter = createOpenRouter({
            apiKey: apiKey || '',
        });
    }

    async chat(messages: ChatMessage[], context?: string): Promise<string> {
        const combinedTools = {
            ...localTools,
            ...this.mcpService.getTools(),
        };
        console.log('Sending tools to AI (non-stream):', Object.keys(combinedTools));

        const { text } = await generateText({
            model: this.openrouter.chat(this.model),
            messages: this.toCoreMessages(messages),
            tools: combinedTools,
            maxSteps: 15,
            system: this.getSystemPrompt(context),
        });

        return text;
    }

    async *chatStream(messages: ChatMessage[], context?: string): AsyncGenerator<{ type: string; textDelta?: string; toolName?: string; args?: unknown; result?: unknown }> {
        const combinedTools = {
            ...localTools,
            ...this.mcpService.getTools(),
        };
        console.log('Sending tools to AI (stream):', Object.keys(combinedTools));

        const result = streamText({
            model: this.openrouter.chat(this.model),
            messages: this.toCoreMessages(messages),
            tools: combinedTools,
            maxSteps: 15,
            system: this.getSystemPrompt(context),
        });

        for await (const chunk of result.fullStream) {
            yield chunk as { type: string; textDelta?: string; toolName?: string; args?: unknown; result?: unknown };
        }
    }

    private getSystemPrompt(context?: string): string {
        let prompt = `
            Today is ${new Date().toLocaleString('en-US')}.

            You are a highly capable and autonomous technical support agent specialized in spa systems.
            Your goal is to resolve user issues fully and independently using the provided tools.

            You are an assistant operating in a **message-like chat environment**.  
            Your responses should look natural in a conversation bubble — short, structured, and easy to read.

            Write in **Czech**, using **Markdown**.  
            Prefer bullet points (where is makes sense) and short paragraphs. No yapping.
            highlight important text by **text**
            Do not use section titles such as “Odpověď na dotaz” or “Shrnutí”.  
            Just write the answer directly.

            **Tools**
            service_call_items_assistant:
                MASTER PRICING & PARTS CALCULATOR.
                Use this tool for ALL questions regarding:
                1. Spare part prices and identification (Bill of Materials).
                2. Service intervention cost estimates (Labor + Parts + Delivery).
                3. Technical composition of the spa.
                
                INPUT PROTOCOL:
                - Extract and pass any known IDs (MasterID, ItemCode) explicitly if available.
                
                ERROR HANDLING PROTOCOL (The Loop):
                - The tool returns structured JSON.
                - If the tool returns: { "info_needed": "missing_item_code" } (or similar key):
                1. DO NOT ask the user immediately.
                2. CHECK your conversation history and memory again for the missing parameter.
                3. IF FOUND: Call this tool AGAIN immediately with the new parameter included.
                4. ONLY ask the user if the parameter is completely absent from the entire context.

            **Core Behavior & Autonomy:**
            - **Think before acting:** Analyze the user's request and plan which tools will provide the necessary data.
            - **Resilience:** If a tool fails or returns empty results, do not stop. Analyze the error, rephrase your query, modify parameters, or try a different approach immediately.
            - **Context Awareness:** You have access to chat history and PostgreSQL memory. Always check these sources for missing parameters before complaining.
            - **Service Communication:** You are the bridge. Do not tell the user to contact service; YOU interact with the service tools directly.

            **Diagnostic Chain Protocol:**
            - When dealing with a malfunction or checking history (e.g. "co se tam kazilo?", "historie oprav"):
            1. Call \`servisni_hlaseni\` with relevant info to get the list of tickets.
            2. Identify the most recent or relevant tickets.
            3. AUTOMATICALLY call \`get_service_call\` for those specific IDs to understand details.
            4. Only answer the user after you have read the details.

            **Data Gathering Protocol:**
            - **Zero-User-Friction:** BEFORE asking the user for ANY missing parameter, you MUST attempt to retrieve it using available tools like \`Spa_info\`.
            - Parse the tool output. If the address/info is found, use it silently.

            **MCP Service Tools:**
            You have access to these specialized tools from our service backend:
            - get_delivery_tarif_cost: Calculation of transport costs.
            - servisni_hlaseni: Overview of service reports for a spa.
            - get_service_call: Detailed info about a specific service ticket.
            - rag_historic_service_calls_resolutions: Search in historical repairs.
            - RAG_navody_spa / servis_navody: Search in technical manuals and instructions.
            - Spa_info: Detailed technical info about a specific spa unit.

            **CURRENT PAGE CONTEXT:**
        `;
        if (context) {
            prompt += `\n\nAktuální kontext stránky (ze které uživatel píše): ${context}\n`;
        }
        return prompt;
    }

    private toCoreMessages(messages: ChatMessage[]): CoreMessage[] {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content,
        }));
    }
}
