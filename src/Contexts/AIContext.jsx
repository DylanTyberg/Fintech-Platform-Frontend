// contexts/AIContext.js
import React, { createContext, useContext, useState } from 'react';

const AIContext = createContext();

export const AIProvider = ({ children }) => {
  const [conversationHistory, setConversationHistory] = useState({
    prompts: [],
    responses: []
  });
  const [isAILoading, setIsAILoading] = useState(false);

  const askAI = async (userId, newPrompt, pageContext) => {
    setIsAILoading(true);
    
    try {
      const response = await fetch('https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          prompts: conversationHistory.prompts,
          responses: conversationHistory.responses,
          prompt: pageContext + newPrompt
        })
      });

      const data = await response.json();
      const aiResponse = data.summary;

      // Update conversation history
      setConversationHistory(prev => ({
        prompts: [...prev.prompts, newPrompt],
        responses: [...prev.responses, aiResponse]
      }));

      setIsAILoading(false);
      return aiResponse;

    } catch (error) {
      console.error('AI request failed:', error);
      setIsAILoading(false);
      throw error;
    }
  };

  const clearConversation = () => {
    setConversationHistory({
      prompts: [],
      responses: []
    });
  };

  return (
    <AIContext.Provider value={{ 
      conversationHistory, 
      askAI, 
      clearConversation,
      isAILoading 
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};