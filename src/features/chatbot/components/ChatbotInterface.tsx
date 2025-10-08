'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { ChatMessage, ChatbotPreferences } from '@/shared/types/chatbot';
import { RecommendedPlace } from '@/core/services/recommender';

interface ChatbotInterfaceProps {
  onClose?: () => void;
}

export const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you discover amazing places in Trento. What kind of experience are you looking for today? 🗺️",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedPlace[]>([]);
  const [preferences, setPreferences] = useState<ChatbotPreferences | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.isComplete) {
        setIsComplete(true);
        setPreferences(data.preferences);
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble right now. Could you try again?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const restartChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm here to help you discover amazing places in Trento. What kind of experience are you looking for today? 🗺️",
        timestamp: new Date()
      }
    ]);
    setIsComplete(false);
    setRecommendations([]);
    setPreferences(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Chat Section - Always visible */}
      <div className="flex flex-col w-full lg:w-1/2 border-r border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Travel Assistant</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isComplete ? 'Recommendations ready!' : 'Ask me anything about Trento'}
              </p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          )}
        </div>

        {/* Chat Messages - Fixed height, always scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!isComplete && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what you're looking for..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Chat complete actions */}
        {isComplete && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={restartChat}
              className="w-full bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              New Search
            </Button>
          </div>
        )}
      </div>

      {/* Recommendations Panel - Shows when complete */}
      {isComplete && (
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">🎯</span>
              Your Perfect Matches
            </h3>
            {preferences && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Based on: {preferences.summary}
              </p>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((place) => {
                  // Calculate match score based on matching tags and rating
                  const matchScore = Math.min(95, 60 + (place.matching_tags.length * 8) + (place.average_rating * 3));
                  
                  return (
                    <div
                      key={place.id}
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {place.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {place.category.replace('-', ' ')} • {place.city}
                          </p>
                        </div>
                        <div className="flex flex-col items-end ml-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            matchScore >= 85 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            matchScore >= 70 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}>
                            {matchScore}% match
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400 mr-1">⭐</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {place.average_rating.toFixed(1)} ({place.review_count})
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {place.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                          {place.description.length > 120 ? 
                            `${place.description.substring(0, 120)}...` : 
                            place.description
                          }
                        </p>
                      )}
                      
                      {place.matching_tags.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Why it matches:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {place.matching_tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-medium"
                              >
                                ✓ {tag.replace('-', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No specific matches found for your request.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Try describing what you&apos;re looking for differently.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};