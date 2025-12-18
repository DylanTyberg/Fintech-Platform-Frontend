
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
      
      const startResponse = await fetch(`${process.env.REACT_APP_API_URL}/ai-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          prompts: conversationHistory.prompts,
          responses: conversationHistory.responses,
          prompt: pageContext + newPrompt
        })
      });

      const { jobId } = await startResponse.json();
      console.log('AI job started:', jobId);

     
      let aiResponse;
      let attempts = 0;
      const maxAttempts = 60; 

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const statusResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/ai-insight/${jobId}`
        );
        const status = await statusResponse.json();
        
        console.log(`Poll attempt ${attempts + 1}: ${status.status}`);

        if (status.status === 'COMPLETED') {
          aiResponse = status.result;
          break;
        }
        
        if (status.status === 'FAILED') {
          throw new Error(status.error || 'AI processing failed');
        }
        
        attempts++;
      }

      if (!aiResponse) {
        throw new Error('Request timed out - please try again');
      }

     
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