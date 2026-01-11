import { calculatorTool } from './calculator.tool';

// Export all tools as a single object for use in ChatService
export const tools = {
    calculate: calculatorTool,
};

// Re-export individual tools for selective use
export { calculatorTool };
