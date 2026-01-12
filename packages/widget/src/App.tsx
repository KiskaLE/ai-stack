import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ToolCall {
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    status: 'running' | 'complete';
    agent?: string;
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: ToolCall[];
}

function ToolCallGroup({ toolCalls }: { toolCalls: ToolCall[] }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!toolCalls || toolCalls.length === 0) return null;

    return (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb] shadow-sm transition-all">
            <button
                className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-[#f3f4f6]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#3b82f6]/10 text-[#3b82f6]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                    </div>
                    <span className="text-[12px] font-bold text-[#374151]">
                        Použité nástroje ({toolCalls.length})
                    </span>
                </div>
                <span className={`text-[#9ca3af] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </span>
            </button>

            {isExpanded && (
                <div className="border-t border-[#e5e7eb] bg-white p-1">
                    {toolCalls.map((tc, idx) => (
                        <div key={idx} className="group relative rounded-lg p-2.5 transition-colors hover:bg-[#f9fafb]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${tc.status === 'complete' ? 'bg-[#10b981]' : 'bg-[#f59e0b] animate-pulse'}`} />
                                <span className="text-[12px] font-bold text-[#111827]">{tc.toolName}</span>
                            </div>

                            <div className="space-y-2 pl-3.5">
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider font-bold text-[#9ca3af] mb-1">Vstup</div>
                                    <pre className="font-mono text-[10px] text-[#4b5563] bg-[#fdfdfd] p-2 rounded-md border border-[#f0f0f0] overflow-x-auto">
                                        {JSON.stringify(tc.args, null, 2)}
                                    </pre>
                                </div>
                                {tc.result != null && (
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-[#9ca3af] mb-1">Výstup</div>
                                        <div className="font-mono text-[10px] text-[#047857] bg-[#ecfdf5]/50 p-2 rounded-md border border-[#d1fae5] overflow-x-auto break-all">
                                            {typeof tc.result === 'string'
                                                ? tc.result
                                                : JSON.stringify(tc.result, null, 2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MessageContent({ content, role }: { content: string; role: string }) {
    if (!content && role === 'assistant') return null;

    // Clean up hallucinated tool calls at the start (some models output JSON text when tools are not properly configured)
    let displayContent = content;
    if (role === 'assistant') {
        const toolJsonRegex = /^\{"tool":\s*"[^"]*",\s*"input":\s*\{.*?\}\}\s*/s;
        displayContent = content.replace(toolJsonRegex, '').trim();
    }

    if (!displayContent && role === 'assistant') return null;

    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-[18px] font-bold uppercase tracking-[0.04em] mb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-[16px] font-bold uppercase tracking-[0.04em] mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-[15px] font-bold uppercase tracking-[0.04em] mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-[18px] mb-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-[18px] mb-2" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    a: ({ node, ...props }) => <a className="font-semibold underline text-inherit hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer" {...props} />,
                    code: ({ node, ...props }) => (
                        <code className="bg-[#f1f1f1] px-1.5 py-0.5 rounded border border-[#d0d0d0] font-mono text-[13px] text-[#1f1f1f]" {...props} />
                    ),
                    pre: ({ node, ...props }) => (
                        <pre className="mt-2 bg-[#2f2f2f] text-[#f7f7f7] rounded-[14px] border border-[#1d1d1d] overflow-x-auto p-[12px_14px]" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                        <div className="table-container relative my-[10px] w-full max-w-full group">
                            <div className="table-wrapper block overflow-x-auto w-full scrollbar-thin">
                                <table className="w-full border-collapse text-[13px]" {...props} />
                            </div>
                        </div>
                    ),
                    th: ({ node, ...props }) => <th className="p-[6px_10px] border border-[#d0d0d0] bg-black/5 font-semibold text-left" {...props} />,
                    td: ({ node, ...props }) => <td className="p-[6px_10px] border border-[#d0d0d0] text-left align-top" {...props} />,
                }}
            >
                {displayContent}
            </ReactMarkdown>
        </div>
    );
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

    const startNewChat = () => {
        setMessages([
            { role: 'assistant', content: 'Dobrý den, jak vám mohu pomoci?' }
        ]);
        setInput('');
    };

    useEffect(() => {
        if (messages.length === 0) {
            startNewChat();
        }
    }, []);

    const getPageContext = () => {
        const findElementByText = (text: string) => {
            const elementsWithId = document.querySelectorAll('[id]');
            for (const el of Array.from(elementsWithId)) {
                if (el.id && el.id.includes(text)) {
                    return el as HTMLInputElement;
                }
            }
            return null;
        };

        const findSiblingValue = (labelText: string) => {
            const titleSpans = document.querySelectorAll("span.sapMObjStatusTitle");
            for (const span of Array.from(titleSpans)) {
                if (span.textContent?.trim() === labelText) {
                    const sibling = span.nextElementSibling;
                    if (sibling && sibling.classList.contains("sapMObjStatusText")) {
                        return sibling;
                    }
                }
            }
            return null;
        };

        const findElementByTextStart = (prefix: string) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                const text = node.nodeValue?.trim();
                if (text?.startsWith(prefix)) {
                    return node.parentElement;
                }
            }
            return null;
        };

        const url = window.location.href;
        let contextObj: any = {};

        if (url.includes("apps.Detail")) {
            const spaType = findSiblingValue('Spa');
            const spaSN = findSiblingValue('Sériové číslo');
            const isWarranty = findSiblingValue('Záruka');
            const ticketNum = findElementByTextStart('Tiket č.');
            contextObj = {
                spa_type: spaType?.innerHTML ?? "",
                spa_serial_number: spaSN?.innerHTML ?? "",
                is_warranty: isWarranty?.innerHTML ?? "",
                ticket_number: ticketNum?.innerHTML?.replace("Tiket č.", "") ?? ""
            };
        } else if (url.includes("field_servis/index.html#/detail/")) {
            const m = url.match(/\/detail\/(\d+)(?=[\/?#]|$)/);
            contextObj = {
                service_call_id: m ? m[1] : ""
            };
        } else if (url.includes("apps.NewTickets")) {
            const spaSN = findElementByText("--spaSerialTypeInput-inner");
            const spaType = findElementByText("--spaTypeInput-inner");
            contextObj = {
                spa_type: spaType?.value ?? "",
                spa_serial_number: spaSN?.value ?? ""
            };
        }

        return contextObj;
    };

    const sendMessage = async (overrideInput?: string) => {
        const textToSend = (overrideInput ?? input).trim();
        if (!textToSend || isLoading) return;

        const userMsg = textToSend;
        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        const assistantMessageIndex = newMessages.length;
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const contextData = getPageContext();
        const contextString = `{page_context:${JSON.stringify(contextData)}};`;

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_API_KEY || ''}`,
                },
                body: JSON.stringify({
                    messages: newMessages,
                    stream: true,
                    context: contextString
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('No reader available');

            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'text' && parsed.text) {
                                accumulatedText += parsed.text;
                                setMessages(prev => {
                                    const msgs = [...prev];
                                    if (msgs[assistantMessageIndex]) {
                                        msgs[assistantMessageIndex] = {
                                            ...msgs[assistantMessageIndex],
                                            content: accumulatedText,
                                        };
                                    }
                                    return msgs;
                                });
                            } else if (parsed.type === 'tool-call') {
                                setMessages(prev => {
                                    const msgs = [...prev];
                                    const msg = msgs[assistantMessageIndex];
                                    if (msg) {
                                        const toolCalls = msg.toolCalls || [];
                                        msgs[assistantMessageIndex] = {
                                            ...msg,
                                            toolCalls: [...toolCalls, {
                                                toolName: parsed.toolName,
                                                args: parsed.args,
                                                status: 'running' as const,
                                            }],
                                        };
                                    }
                                    return msgs;
                                });
                            } else if (parsed.type === 'tool-result') {
                                setMessages(prev => {
                                    const msgs = [...prev];
                                    const msg = msgs[assistantMessageIndex];
                                    if (msg) {
                                        const toolCalls = msg.toolCalls?.map(tc =>
                                            tc.toolName === parsed.toolName && tc.status === 'running'
                                                ? { ...tc, result: parsed.result, status: 'complete' as const }
                                                : tc
                                        );
                                        msgs[assistantMessageIndex] = { ...msg, toolCalls };
                                    }
                                    return msgs;
                                });
                            }
                        } catch { /* skip */ }
                    }
                }
            }

            if (!accumulatedText) {
                setMessages(prev => {
                    const msgs = [...prev];
                    if (msgs[assistantMessageIndex]) {
                        msgs[assistantMessageIndex].content = 'No response received';
                    }
                    return msgs;
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const msgs = [...prev];
                if (msgs[assistantMessageIndex]) {
                    msgs[assistantMessageIndex].content = 'Error connecting to server.';
                }
                return msgs;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const suggestions = [
        "Historie hlášení",
        "Vybavení spa",
        "Doprava od showroomů"
    ];

    return (
        <div className="ai-chat">
            {/* Bubble Button */}
            <button
                className="fixed bottom-[60px] right-[28px] w-[60px] h-[60px] rounded-[14px] bg-[#2d2d2d] text-[#f5f5f5] shadow-[0_12px_28px_rgba(10,10,10,0.35)] flex items-center justify-center cursor-pointer transition-all hover:translate-y-[-2px] hover:bg-[#3b3b3b] hover:shadow-[0_16px_32px_rgba(10,10,10,0.4)] pointer-events-auto z-[9999]"
                onClick={toggleChat}
                aria-expanded={isOpen}
            >
                <span aria-hidden="true" className="flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20C20.5523 4 21 4.44772 21 5V15C21 15.5523 20.5523 16 20 16H11.3L7 19.5V16H4C3.44772 16 3 15.5523 3 15V5C3 4.44772 3.44772 4 4 4Z" fill="currentColor" />
                        <path d="M7 9H17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                        <path d="M7 12H13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                    </svg>
                </span>
                <span className="sr-only">Otevřít chat</span>
            </button>

            {/* Chat Panel */}
            <section
                className={`fixed bottom-[130px] right-[28px] w-[min(450px,92vw)] max-h-[70vh] flex flex-col bg-white rounded-[18px] shadow-[0_28px_64px_rgba(26,26,26,0.35)] overflow-hidden transition-all duration-250 pointer-events-auto z-[9999] ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-[18px] scale-[0.98] pointer-events-none'}`}
                role="dialog"
                aria-hidden={!isOpen}
            >
                {/* Header */}
                <header className="flex justify-between items-center p-[18px_22px] bg-[#2e2e2e] text-[#f7f7f7]">
                    <div className="flex flex-col items-start">
                        <h2 className="m-0 text-[20px] font-bold tracking-wide">USSPA Asistent</h2>

                    </div>
                    <div className="flex items-center gap-[8px]">
                        <button
                            type="button"
                            className="p-[8px_16px] rounded-[12px] text-[12px] font-bold tracking-widest uppercase text-[#f7f7f7] bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border-none"
                            onClick={startNewChat}
                        >
                            Nový chat
                        </button>
                        <button
                            type="button"
                            className="w-[34px] h-[34px] rounded-[10px] bg-white/10 hover:bg-white/20 transition-colors text-[#f7f7f7] text-[22px] flex items-center justify-center cursor-pointer border-none"
                            onClick={toggleChat}
                            aria-label="Zavřít chat"
                        >
                            &times;
                        </button>
                    </div>
                </header>

                {/* Log */}
                <div className="flex-1 p-[22px] overflow-y-auto flex flex-col gap-[14px] bg-white chat-log-scroll" role="log" aria-live="polite">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-[12px] ${msg.role === 'user' ? 'justify-end' : (msg.role === 'system' ? 'justify-center' : 'justify-start')}`}>
                            <div className={`max-w-[78%] min-w-0 p-[12px_16px] text-[14px] leading-relaxed break-words overflow-wrap-anywhere overflow-hidden shadow-none ${msg.role === 'user'
                                ? 'bg-[#2f2f2f] text-[#f7f7f7] rounded-[18px_18px_4px_18px] border border-[#1d1d1d]'
                                : (msg.role === 'system'
                                    ? 'bg-transparent text-[#494949] text-[12px] tracking-[0.12em] uppercase border border-dashed border-[#bdbdbd]'
                                    : 'bg-[#f1f1f1] text-[#1f1f1f] rounded-[18px_18px_18px_4px] border border-[#dedede]')
                                }`}>
                                <MessageContent content={msg.content} role={msg.role} />
                                {msg.role === 'assistant' && isLoading && !msg.content && (
                                    <div className="inline-flex items-center gap-[4px] p-[9px_13px] rounded-[14px] bg-[#f1f1f1] border border-[#dedede]">
                                        <span className="w-[6px] h-[6px] rounded-full bg-[#7a7a7a] opacity-50 animate-[typing_1s_infinite_ease-in-out]"></span>
                                        <span className="w-[6px] h-[6px] rounded-full bg-[#7a7a7a] opacity-50 animate-[typing_1s_infinite_ease-in-out_0.18s]"></span>
                                        <span className="w-[6px] h-[6px] rounded-full bg-[#7a7a7a] opacity-50 animate-[typing_1s_infinite_ease-in-out_0.36s]"></span>
                                    </div>
                                )}
                                {msg.role === 'assistant' && msg.toolCalls && (
                                    <ToolCallGroup toolCalls={msg.toolCalls} />
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Suggestions */}
                    {messages.length === 1 && messages[0].role === 'assistant' && (
                        <div className="flex flex-col gap-[6px] p-[4px_2px_8px] mt-[6px]">
                            {suggestions.map((text, idx) => (
                                <button
                                    key={idx}
                                    className="block w-full text-left p-[9px_12px] rounded-[9px] bg-[#f7f7fa] text-[#1f1f1f] text-[13px] font-semibold border border-[#e3e3e6] hover:bg-[#ededf2] hover:border-[#d7d7dc] hover:-translate-y-[1px] transition-all cursor-pointer select-none"
                                    onClick={() => sendMessage(text)}
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Form */}
                <div className="p-[18px_22px_24px] bg-[#f0f0f0] border-t border-[#d4d4d4]">
                    <div className={`relative w-full bg-white rounded-full border border-[#cbcbcb] p-[12px_70px_12px_20px] shadow-[0_12px_28px_rgba(32,32,32,0.08)] transition-all focus-within:border-[#2f2f2f] focus-within:shadow-[0_18px_34px_rgba(32,32,32,0.12)] ${input.trim() ? 'border-[#2e2e2e] shadow-[0_15px_32px_rgba(32,32,32,0.18)]' : ''}`}>
                        <input
                            className="w-full border-none bg-transparent p-0 text-[#1f1f1f] text-[15px] focus:outline-none placeholder:text-[#8a8a8a]"
                            type="text"
                            placeholder="Zadejte dotaz..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            autoComplete="off"
                        />
                        <button
                            className={`absolute top-1/2 right-[10px] -translate-y-1/2 flex items-center justify-center w-[36px] h-[36px] rounded-full transition-all duration-250 border-none cursor-pointer ${input.trim() ? 'bg-[#2e2e2e] text-white opacity-100 pointer-events-auto scale-100' : 'bg-[#2e2e2e] text-white opacity-0 pointer-events-none scale-[0.92]'}`}
                            type="button"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            aria-label="Odeslat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default App;
