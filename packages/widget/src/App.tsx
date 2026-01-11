import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleChat = () => setIsOpen(!isOpen);

    const clearChat = () => {
        setMessages([]);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // Add empty assistant message that will be streamed into
        const assistantMessageIndex = newMessages.length;
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, stream: true }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No reader available');
            }

            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            break;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                accumulatedText += parsed.text;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    if (newMessages[assistantMessageIndex]) {
                                        newMessages[assistantMessageIndex] = {
                                            ...newMessages[assistantMessageIndex],
                                            content: accumulatedText,
                                        };
                                    }
                                    return newMessages;
                                });
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            // If no text was received, show error
            if (!accumulatedText) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[assistantMessageIndex]) {
                        newMessages[assistantMessageIndex] = {
                            ...newMessages[assistantMessageIndex],
                            content: 'No response received',
                        };
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[assistantMessageIndex]) {
                    newMessages[assistantMessageIndex] = {
                        ...newMessages[assistantMessageIndex],
                        content: 'Error connecting to server.',
                    };
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="font-sans text-gray-800">
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="fixed bottom-5 right-5 w-[60px] h-[60px] rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all z-[1000000]"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-[90px] right-5 w-[350px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden z-[1000000] border border-gray-200 animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="p-4 bg-indigo-600 text-white flex justify-between items-center font-semibold">
                        <span>AI Assistant</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearChat}
                                className="bg-transparent border-none text-white cursor-pointer p-1 hover:bg-white/10 rounded"
                                title="Clear chat"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={toggleChat}
                                className="bg-transparent border-none text-white cursor-pointer p-1 hover:bg-white/10 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                Start a conversation...
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'self-end bg-indigo-600 text-white rounded-br-sm'
                                    : 'self-start bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                                    }`}
                            >
                                {msg.content || (msg.role === 'assistant' && isLoading ? '▊' : '')}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-gray-200 flex gap-2 bg-white">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask anything..."
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading}
                            className="bg-indigo-600 text-white border-0 rounded-lg px-3 flex items-center justify-center cursor-pointer hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
