import React, { useState, useRef, useEffect } from 'react';
import { streamChatResponse } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { SendIcon } from './icons/SendIcon';
import { GeminiIcon } from './icons/GeminiIcon';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const history = messages;
      const stream = await streamChatResponse(history, currentInput);
      
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text();
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error streaming chat response:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <GeminiIcon className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-200">Chat with Gemini</h2>
                <p>Start a conversation by typing your message below.</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl px-4 py-2 rounded-lg whitespace-pre-wrap ${msg.role === 'user' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
              {msg.content}
              {/* Add a blinking cursor to the last model message while loading */}
              {msg.role === 'model' && isLoading && index === messages.length - 1 && (
                <span className="inline-block w-2 h-4 ml-1 bg-red-400 animate-pulse"></span>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
             <div className="flex justify-start">
                <div className="max-w-md lg:max-w-lg px-4 py-3 rounded-lg bg-gray-700 text-gray-200">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-200 placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 disabled:bg-red-800 disabled:cursor-not-allowed transition duration-200"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;