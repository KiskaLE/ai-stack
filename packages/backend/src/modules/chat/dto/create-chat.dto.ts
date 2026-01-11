import { z } from 'zod';

export const createChatSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1)
    })).min(1),
    stream: z.boolean().optional()
});

export type CreateChatDto = z.infer<typeof createChatSchema>;
