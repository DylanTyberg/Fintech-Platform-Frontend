import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '../../Contexts/AIContext'
import { useUser } from '../../Contexts/UserContext';
import ReactMarkdown from 'react-markdown';
import './AIChat.css';

const AIChat = ({ pageContext = "" }) => {
  const { askAI, clearConversation, isAILoading } = useAI();
  
  // Local display state only — not sent to backend
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const { state } = useUser();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAILoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isAILoading) return;

    const prompt = input;
    setInput('');

    // Add user message to display immediately
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);

    try {
      // askAI no longer needs userId — extracted from JWT server-side
      const response = await askAI(prompt, pageContext);
      
      // Add AI response to display
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
    }
  };

  const handleClear = () => {
    setMessages([]);
    clearConversation(); // resets sessionId server-side
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-history">
        {messages.length === 0 ? (
          <p className="ai-chat-empty">
            Ask me anything about your portfolio or the market...
          </p>
        ) : (
          messages.map((message, i) => (
            <div key={i} className="ai-chat-exchange">
              {message.role === 'user' ? (
                <div className="ai-chat-user-message">
                  <strong></strong> {message.content}
                </div>
              ) : (
                <div className="ai-chat-ai-message">
                  <strong className="ai-chat-ai-label">AI:</strong>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))
        )}

        {isAILoading && (
          <div className="ai-chat-loading">
            <strong className="ai-chat-ai-label">AI:</strong> Thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="ai-chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your portfolio, market trends, or stock recommendations..."
          disabled={isAILoading}
          className="ai-chat-input"
        />

        <button
          type="submit"
          disabled={isAILoading || !input.trim()}
          className="ai-chat-submit-btn"
        >
          {isAILoading ? 'Sending...' : 'Send'}
        </button>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isAILoading}
            className="ai-chat-clear-btn"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
};

export default AIChat;