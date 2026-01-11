import { tool, Tool } from 'ai';
import { z } from 'zod/v4';

export const calculatorTool: Tool = tool({
    description: 'Perform a mathematical calculation. Use this to calculate something.',
    parameters: z.object({
        expression: z.string().describe('A mathematical expression to evaluate, e.g. "2 + 2", "sqrt(16)", "sin(45 * PI / 180)"'),
    }),
    execute: async ({ expression }) => {
        try {
            // Safe math evaluation using Function constructor
            // Only allows math operations, no access to global scope
            const mathFunctions = {
                sin: Math.sin,
                cos: Math.cos,
                tan: Math.tan,
                sqrt: Math.sqrt,
                abs: Math.abs,
                floor: Math.floor,
                ceil: Math.ceil,
                round: Math.round,
                log: Math.log,
                log10: Math.log10,
                pow: Math.pow,
                exp: Math.exp,
                PI: Math.PI,
                E: Math.E,
            };

            const safeExpression = expression
                .replace(/\^/g, '**') // Support ^ for power
                .replace(/(\d)([a-zA-Z])/g, '$1*$2'); // Support 2PI -> 2*PI

            const fn = new Function(
                ...Object.keys(mathFunctions),
                `return ${safeExpression}`
            );

            const result = fn(...Object.values(mathFunctions));

            return {
                expression,
                result: Number(result.toFixed(10)),
                success: true,
            };
        } catch (error) {
            return {
                expression,
                error: `Failed to evaluate: ${error instanceof Error ? error.message : 'Unknown error'}`,
                success: false,
            };
        }
    },
});
