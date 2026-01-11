export default () => ({
    openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY || '',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    },
    apiKey: process.env.API_KEY,
});
