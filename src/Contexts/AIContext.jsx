import React, { createContext, useContext, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const AIContext = createContext();

export const AIProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);

  const askAI = async (newPrompt, pageContext) => {
    setIsAILoading(true);

    try {
      // Get auth token — userId extracted server-side from JWT
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const startResponse = await fetch(`${process.env.REACT_APP_API_URL}/ai-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include token if user is signed in — optional for public endpoint
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          prompt: pageContext + newPrompt,
          // Pass sessionId to maintain conversation continuity server-side
          sessionId: sessionId
        })
      });

      const { jobId } = await startResponse.json();

      // Poll for result
      let aiResponse;
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const statusResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/ai-insight/${jobId}`,
          {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          }
        );
        const status = await statusResponse.json();

        if (status.status === 'COMPLETED') {
          aiResponse = status.result;
          // Store sessionId returned from server for conversation continuity
          if (status.sessionId) setSessionId(status.sessionId);
          break;
        }

        if (status.status === 'FAILED') {
          throw new Error(status.error || 'AI processing failed');
        }

        attempts++;
      }

      if (!aiResponse) throw new Error('Request timed out - please try again');

      setIsAILoading(false);
      return aiResponse;

    } catch (error) {
      console.error('AI request failed:', error);
      setIsAILoading(false);
      throw error;
    }
  };

  const clearConversation = () => {
    // Clear server-side session by resetting sessionId
    setSessionId(null);
  };

  return (
    <AIContext.Provider value={{ askAI, clearConversation, isAILoading }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within AIProvider');
  return context;
};