import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '../../Contexts/AIContext'
import { useUser } from '../../Contexts/UserContext';
import ReactMarkdown from 'react-markdown';
import './AIChat.css';

const AIChat = ({pageContext = ""}) => {
  const { askAI, conversationHistory, isAILoading, clearConversation } = useAI();
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const {state} = useUser();
  const userId = state.user?.userId

  //
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, isAILoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isAILoading) return;

    const prompt = input;
    setInput('');
    
    try {
      await askAI(userId, prompt, pageContext);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
  };

  return (
    <div className="ai-chat-container">
    
      <div className="ai-chat-history">
        {conversationHistory.prompts.length === 0 ? (
          <p className="ai-chat-empty">
            Ask me anything about your portfolio or the market...
          </p>
        ) : (
          conversationHistory.prompts.map((prompt, i) => (
            <div key={i} className="ai-chat-exchange">
             
              <div className="ai-chat-user-message">
                <strong></strong> {prompt}
              </div>
              
              
              <div className="ai-chat-ai-message">
                <strong className="ai-chat-ai-label">AI:</strong>
                <ReactMarkdown>{conversationHistory.responses[i]}</ReactMarkdown>
              </div>
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
        
        {conversationHistory.prompts.length > 0 && (
          <button
            type="button"
            onClick={clearConversation}
            disabled={isAILoading}
            className="ai-chat-clear-btn"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}

export default AIChat;