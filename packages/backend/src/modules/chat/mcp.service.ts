import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { z } from 'zod/v4';
import {
    ListToolsResultSchema,
    Tool
} from '@modelcontextprotocol/sdk/types.js';

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
    private client: Client;
    private mcpTools: any = {};

    constructor(private configService: ConfigService) {
        const mcpUrl = this.configService.get<string>('MCP_SERVER_URL');

        if (mcpUrl) {
            this.client = new Client(
                {
                    name: "ai-stack-backend",
                    version: "1.0.0",
                },
                {
                    capabilities: {
                        tools: {},
                    } as any,
                }
            );
        }
    }

    async onModuleInit() {
        const mcpUrl = this.configService.get<string>('MCP_SERVER_URL');
        const mcpApiKey = this.configService.get<string>('MCP_SERVER_API_KEY');
        if (!this.client || !mcpUrl) return;

        try {
            console.log(`Connecting to MCP server at ${mcpUrl}...`);
            const transport = new SSEClientTransport(new URL(mcpUrl), {
                headers: mcpApiKey ? {
                    'Authorization': `Bearer ${mcpApiKey}`
                } : {}
            } as any);
            await this.client.connect(transport);
            console.log('Connected to MCP server.');

            await this.refreshTools();
        } catch (error) {
            console.error('Failed to connect to MCP server:', error);
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.close();
        }
    }

    async refreshTools() {
        if (!this.client) {
            console.warn('MCP Client not initialized. Cannot refresh tools.');
            return;
        }

        try {
            console.log('Refreshing tools from MCP server...');
            const result = await this.client.request(
                { method: "tools/list" },
                ListToolsResultSchema
            );

            this.mcpTools = {};
            for (const tool of result.tools) {
                this.mcpTools[tool.name] = tool;
            }
            console.log(`Loaded ${result.tools.length} total tools from MCP server.`);

            const foundAllowed = result.tools
                .map(t => t.name)
                .filter(name => this.allowedTools.includes(name));

            console.log(`Matched ${foundAllowed.length} tools from whitelist:`, foundAllowed);
        } catch (error) {
            console.error('Failed to list tools from MCP server:', error);
        }
    }

    private readonly allowedTools = [
        "get_delivery_tarif_cost",
        "servisni_hlaseni",
        "get_service_call",
        "rag_historic_service_calls_resolutions",
        "RAG_navody_spa",
        "servis_navody",
        "Spa_info"
    ];

    getTools() {
        // Convert MCP tools to AI SDK compatible tool format
        const aiSdkTools: any = {};

        for (const [name, tool] of Object.entries(this.mcpTools)) {
            // Only include tools that are in the allowed list
            if (!this.allowedTools.includes(name)) continue;

            const mcpTool = tool as Tool;
            const parametersSummary = mcpTool.inputSchema ? ` (Parameters needed: ${JSON.stringify(mcpTool.inputSchema)})` : '';

            aiSdkTools[name] = {
                description: `${mcpTool.description}${parametersSummary}`,
                parameters: z.any(),
                execute: async (args: any) => {
                    const result = await this.client.callTool({
                        name: mcpTool.name,
                        arguments: args,
                    });

                    const content = result.content as any[];

                    // Standardizing result for AI SDK
                    if (result.isError) {
                        throw new Error(JSON.stringify(content));
                    }

                    // Extract text content if available
                    const textContent = content
                        .filter(c => c.type === 'text')
                        .map(c => c.text)
                        .join('\n');

                    return textContent || content;
                }
            };
        }

        return aiSdkTools;
    }
}
