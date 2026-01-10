import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleChat = () => setIsOpen(!isOpen);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { text: data.text || 'No response', sender: 'bot' }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { text: 'Error connecting to server.', sender: 'bot' }]);
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
                        <button
                            onClick={toggleChat}
                            className="bg-transparent border-none text-white cursor-pointer p-1 hover:bg-white/10 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                    ? 'self-end bg-indigo-600 text-white rounded-br-sm'
                                    : 'self-start bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="self-start bg-white border border-gray-200 text-gray-500 rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm italic shadow-sm">
                                Typing...
                            </div>
                        )}
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
