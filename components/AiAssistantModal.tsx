

import React, { useState, useEffect, useRef } from 'react';
import { useFitness } from '../context/FitnessContext';
import { X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiAssistantModalProps {
    onClose: () => void;
    initialPrompt?: string;
}

type Message = {
    role: 'user' | 'model';
    content: string;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose, initialPrompt }) => {
    const { getAiFitnessCoachResponse } = useFitness();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // This effect handles the initial state of the modal.
        // It's designed to be robust in React's Strict Mode, which can cause effects to run twice in development.
        let ignore = false;

        if (initialPrompt) {
            const getInitialResponse = async () => {
                setIsLoading(true);
                const userMessage: Message = { role: 'user', content: initialPrompt };

                // Set user message immediately so it's visible.
                if (!ignore) {
                    setMessages([userMessage]);
                }
                
                try {
                    const aiResponse = await getAiFitnessCoachResponse(initialPrompt);
                    if (!ignore) { // Only update state if the component is still mounted.
                        const modelMessage: Message = { role: 'model', content: aiResponse };
                        setMessages([userMessage, modelMessage]);
                    }
                } catch (error) {
                    console.error(error);
                    if (!ignore) {
                        const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
                        setMessages([userMessage, errorMessage]);
                    }
                } finally {
                    if (!ignore) {
                        setIsLoading(false);
                    }
                }
            };
            getInitialResponse();
        } else {
            setMessages([
                { role: 'model', content: "Hello! I'm your AI Fitness Coach. Ask me anything about your workout plans, nutrition, or how to improve your performance." }
            ]);
        }
        
        // Cleanup function: on unmount, set the ignore flag.
        // In Strict Mode, this will run after the first mount, preventing the first (abandoned) API call from setting state.
        return () => {
            ignore = true;
        };
    }, [initialPrompt, getAiFitnessCoachResponse]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (prompt?: string) => {
        const messageText = prompt || input;
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        if (!prompt) {
            setInput('');
        }
        setIsLoading(true);

        try {
            const aiResponse = await getAiFitnessCoachResponse(messageText);
            const modelMessage: Message = { role: 'model', content: aiResponse };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage();
    };
    
    const suggestedPrompts = [
        "Analyze my last workout.",
        "Suggest a chest exercise to add to my 'Push Day' plan.",
        "How can I improve my squat form?",
        "What should I eat after a workout?"
    ];

    const markdownComponents = {
        h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold text-electric-blue-400 my-2" {...props} />,
        ul: ({node, ...props}: any) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
        li: ({node, ...props}: any) => <li className="pl-2" {...props} />,
        p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
        strong: ({node, ...props}: any) => <strong className="font-bold text-white" {...props} />,
        hr: ({node, ...props}: any) => <hr className="border-slate-600 my-4" {...props} />,
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col z-50">
            {/* Header */}
            <div className="flex-shrink-0 bg-slate-900/80 p-4 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center">
                    <Sparkles className="w-6 h-6 mr-3 text-electric-blue-400"/>
                    <h2 className="text-xl font-bold text-white">AI Fitness Coach</h2>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-prose p-3 rounded-lg ${msg.role === 'user' ? 'bg-electric-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                            {msg.role === 'model' ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                    {msg.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="bg-slate-800 p-3 rounded-lg flex items-center space-x-2">
                           <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></span>
                           <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                           <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 bg-slate-900/80 p-4 border-t border-slate-700">
                {messages.length <= 1 && !initialPrompt && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {suggestedPrompts.map((prompt, i) => (
                            <button key={i} onClick={() => handleSendMessage(prompt)} className="text-left text-sm p-2 bg-slate-800 rounded-md hover:bg-slate-700">
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={handleFormSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className="flex-1 bg-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-electric-blue-500 border-none"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-electric-blue-600 rounded-lg text-white font-bold hover:bg-electric-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed">
                        <Send />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiAssistantModal;
