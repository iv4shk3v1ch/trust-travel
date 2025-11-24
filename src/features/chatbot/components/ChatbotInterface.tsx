'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/shared/components/Button';
import { PlaceCard } from '@/shared/components/PlaceCard';
import { ChatMessage, ChatbotPreferences } from '@/shared/types/chatbot';
import { RecommendedPlace } from '@/core/services/recommender';

// Dynamically import the map to avoid SSR issues
const InteractiveMap = dynamic<{ recommendations: RecommendedPlace[]; className: string }>(
  () => import('./InteractiveMap').then(mod => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">Loading map...</div>
  }
);

interface ChatbotInterfaceProps {
  onClose?: () => void;
}

// LocalStorage keys
const CHATBOT_STORAGE_KEY = 'trusttravel_chatbot_session';
const CHATBOT_SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface ChatbotSession {
  messages: ChatMessage[];
  allRecommendations: RecommendedPlace[];
  timestamp: number;
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
  const [loadingMessage, setLoadingMessage] = useState<string>(''); // Progressive loading message
  const [recommendations, setRecommendations] = useState<RecommendedPlace[]>([]);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [lastApiResponse, setLastApiResponse] = useState<{ success: boolean; places?: RecommendedPlace[]; preferences?: ChatbotPreferences; isComplete?: boolean; response?: string } | null>(null);
  const [allRecommendations, setAllRecommendations] = useState<RecommendedPlace[]>([]); // Cumulative recommendations
  const [rightPanelView, setRightPanelView] = useState<'map' | 'list'>('map'); // Toggle between map and list
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history from localStorage on mount
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const stored = localStorage.getItem(CHATBOT_STORAGE_KEY);
        if (!stored) return;

        const session: ChatbotSession = JSON.parse(stored);
        
        // Check if session is still valid (not expired)
        const now = Date.now();
        if (now - session.timestamp > CHATBOT_SESSION_TTL) {
          console.log('💾 Chatbot session expired, starting fresh');
          localStorage.removeItem(CHATBOT_STORAGE_KEY);
          return;
        }

        // Restore messages with Date objects
        const restoredMessages = session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));

        console.log(`💾 Restored chatbot session: ${restoredMessages.length} messages, ${session.allRecommendations.length} places`);
        
        setMessages(restoredMessages);
        setAllRecommendations(session.allRecommendations);
        setIsSessionRestored(true);
      } catch (error) {
        console.error('Error loading chat history:', error);
        localStorage.removeItem(CHATBOT_STORAGE_KEY);
      }
    };

    loadChatHistory();
  }, []);

  // Save chat history to localStorage whenever messages or recommendations change
  useEffect(() => {
    // Don't save during initial mount (before restoration check)
    if (!isSessionRestored && messages.length === 1) return;

    try {
      const session: ChatbotSession = {
        messages,
        allRecommendations,
        timestamp: Date.now()
      };

      localStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(session));
      console.log(`💾 Saved chatbot session: ${messages.length} messages, ${allRecommendations.length} places`);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages, allRecommendations, isSessionRestored]);

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
    setLoadingMessage('Understanding your request...');

    // Progressive loading states
    const loadingTimer1 = setTimeout(() => {
      setLoadingMessage('Finding the best places...');
    }, 2000);

    const loadingTimer2 = setTimeout(() => {
      setLoadingMessage('Almost there...');
    }, 5000);

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

      // Clear loading timers
      clearTimeout(loadingTimer1);
      clearTimeout(loadingTimer2);

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Save for debugging
      setLastApiResponse(data);
      
      console.log('🔍 API Response:', {
        success: data.success,
        isComplete: data.isComplete,
        placesCount: data.places?.length || 0,
        hasPreferences: !!data.preferences
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Always check for places, and add them to the cumulative list
      if (data.places && data.places.length > 0) {
        console.log(`🎯 Found ${data.places.length} places to display on map`);
        console.log('📍 Place details:', data.places.map((r: RecommendedPlace) => ({ 
          name: r.name, 
          category: r.category, 
          rating: r.average_rating,
          coordinates: { lat: r.latitude, lng: r.longitude }
        })));
        
        // Add new places to existing recommendations (cumulative)
        setAllRecommendations(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPlaces = data.places.filter((p: RecommendedPlace) => !existingIds.has(p.id));
          console.log(`📍 Adding ${newPlaces.length} new places to map (${prev.length} existing)`);
          return [...prev, ...newPlaces];
        });
        
        // Also update current recommendations for other UI elements
        setRecommendations(data.places);
      }

      // Note: Preferences are stored in lastApiResponse for debug display

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
      setLoadingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const restartChat = () => {
    // Clear localStorage
    localStorage.removeItem(CHATBOT_STORAGE_KEY);
    console.log('🔄 Chatbot session cleared');
    
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm here to help you discover amazing places in Trento. What kind of experience are you looking for today? 🗺️",
        timestamp: new Date()
      }
    ]);
    setRecommendations([]);
    setAllRecommendations([]); // Clear cumulative recommendations
    setShowMobileMap(false);
    setIsSessionRestored(true); // Mark as ready to save new session
    inputRef.current?.focus();
  };

  // Toggle mobile map
  const toggleMobileMap = () => {
    setShowMobileMap(!showMobileMap);
  };

  // Toggle fullscreen map
  const toggleFullscreenMap = () => {
    setIsMapFullscreen(!isMapFullscreen);
  };

  // Mobile Map Modal Component
  const MobileMapModal = () => {
    if (!showMobileMap || allRecommendations.length === 0) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">🗺️</span>
              Places Map ({recommendations.length} found)
            </h3>
            <Button
              onClick={toggleMobileMap}
              variant="outline"
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
          <div className="flex-1">
            <InteractiveMap 
              recommendations={allRecommendations} 
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    );
  };

  // Fullscreen Map Modal Component
  const FullscreenMapModal = () => {
    if (!isMapFullscreen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">🗺️</span>
              Fullscreen Map - {allRecommendations.length} Places
            </h3>
            <Button
              onClick={toggleFullscreenMap}
              variant="outline"
              className="text-gray-500 hover:text-gray-700"
            >
              Exit Fullscreen
            </Button>
          </div>
          <div className="flex-1">
            <InteractiveMap 
              recommendations={allRecommendations} 
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        {/* Left Side - Chat (50% on desktop, full width on mobile) */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="font-semibold">AI-Powered Recommendations</h3>
                <p className="text-sm text-white/80">
                  {allRecommendations.length > 0 ? `${allRecommendations.length} places discovered!` : 'Discover amazing places in Trento'}
                  {isSessionRestored && messages.length > 1 && (
                    <span className="ml-2 text-xs">💾 Session restored</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Mobile Map Button - Only show on mobile when we have recommendations */}
              {allRecommendations.length > 0 && (
                <Button
                  onClick={toggleMobileMap}
                  className="lg:hidden bg-white/20 border-white/30 hover:bg-white/30 text-white px-3 py-2 text-sm"
                >
                  <span className="flex items-center space-x-1">
                    <span>�️</span>
                    <span>Map</span>
                  </span>
                </Button>
              )}
              {onClose && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-indigo-500 text-white ml-12'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white mr-12 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl mr-12 border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  {loadingMessage && (
                    <span className="text-sm text-gray-600 dark:text-gray-300">{loadingMessage}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>

          {/* Debug Panel */}
          {lastApiResponse && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">🐛 Debug Info</h3>
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-yellow-600 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-100"
                >
                  {showDebugInfo ? '🔽' : '▶️'}
                </button>
              </div>
              
              {showDebugInfo && (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Response Status:</p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        {lastApiResponse.success ? '✅ Success' : '❌ Failed'} 
                        {lastApiResponse.isComplete && ' | 🏁 Complete'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Places Found:</p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        {lastApiResponse.places?.length || 0} locations
                      </p>
                    </div>
                  </div>
                  
                  {lastApiResponse.preferences && (
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Detected Preferences:</p>
                      <div className="bg-yellow-100 dark:bg-yellow-800/30 p-2 rounded text-yellow-800 dark:text-yellow-200">
                        <p><strong>Categories:</strong> {lastApiResponse.preferences.categories?.join(', ') || 'None'}</p>
                        <p><strong>Experience Tags:</strong> {lastApiResponse.preferences.experienceTags?.join(', ') || 'None'}</p>
                        <p><strong>Destination:</strong> {lastApiResponse.preferences.destination || 'None'}</p>
                        <p><strong>Budget:</strong> {lastApiResponse.preferences.budget || 'None'}</p>
                      </div>
                    </div>
                  )}
                  
                  {lastApiResponse.places && lastApiResponse.places.length > 0 && (
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Places Preview:</p>
                      <div className="bg-yellow-100 dark:bg-yellow-800/30 p-2 rounded text-yellow-800 dark:text-yellow-200 max-h-32 overflow-y-auto">
                        {lastApiResponse.places.slice(0, 5).map((place: RecommendedPlace, index: number) => (
                          <p key={index} className="text-xs">
                            • {place.name} ({place.category}) - ⭐{place.average_rating}
                          </p>
                        ))}
                        {lastApiResponse.places.length > 5 && (
                          <p className="text-xs italic">...and {lastApiResponse.places.length - 5} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Input Area - Always available for continuous conversation */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything: 'restaurants in old town', 'add hiking trails', 'show me bars for tonight'..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>Send</span>
                  <span>→</span>
                </Button>
              </div>
            </div>

          {/* Chat actions - always show restart button */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={restartChat}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 py-3 transition-all duration-200"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>�</span>
                  <span>New Search</span>
                </span>
              </Button>
            </div>
        </div>

        {/* Right Side - Map or Places List */}
        <div className="hidden lg:flex lg:w-1/2 flex-col border-l border-gray-200 dark:border-gray-700">
          {allRecommendations.length > 0 ? (
            <>
              {/* Tabs Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
                {/* Tab Buttons */}
                <div className="flex border-b border-gray-700">
                  <button
                    onClick={() => setRightPanelView('map')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 transition-all ${
                      rightPanelView === 'map'
                        ? 'bg-gray-700 text-white border-b-2 border-indigo-400'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span>🗺️</span>
                    <span className="font-medium">Map View</span>
                  </button>
                  <button
                    onClick={() => setRightPanelView('list')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 transition-all ${
                      rightPanelView === 'list'
                        ? 'bg-gray-700 text-white border-b-2 border-indigo-400'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span>📍</span>
                    <span className="font-medium">Places List ({allRecommendations.length})</span>
                  </button>
                </div>
                
                {/* Tab Info */}
                <div className="px-4 py-2">
                  {rightPanelView === 'map' ? (
                    <p className="text-sm text-gray-300">
                      {allRecommendations.length} places on map • Click markers for details
                    </p>
                  ) : (
                    <p className="text-sm text-gray-300">
                      👍 Like, 💾 Save, or ✕ Hide places to personalize future recommendations
                    </p>
                  )}
                </div>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelView === 'map' ? (
                  /* Map View */
                  <div className="h-full relative">
                    <div className="absolute inset-0 bg-gray-900">
                      <InteractiveMap 
                        recommendations={allRecommendations} 
                        className="h-full w-full"
                      />
                    </div>
                    {/* Fullscreen Button */}
                    <button
                      onClick={toggleFullscreenMap}
                      className="absolute bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-all z-10 flex items-center space-x-2"
                    >
                      <span>⛶</span>
                      <span>Fullscreen</span>
                    </button>
                  </div>
                ) : (
                  /* Places List View */
                  <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Click the buttons to track your preferences:
                      <div className="mt-2 space-y-1">
                        <div>👍 <strong>Like</strong> - Recommend more places like this</div>
                        <div>💾 <strong>Save</strong> - Save for your trip</div>
                        <div>✕ <strong>Hide</strong> - Don&apos;t show places like this again</div>
                      </div>
                    </div>
                    
                    {allRecommendations.map((place, index) => (
                      <PlaceCard
                        key={place.id}
                        place={{
                          id: place.id,
                          name: place.name,
                          place_type_id: place.id, // Using place id as fallback
                          city: place.city,
                          country: 'Italy',
                          address: place.address || null,
                          latitude: place.latitude || null,
                          longitude: place.longitude || null,
                          phone: place.phone || null,
                          website: place.website || null,
                          working_hours: place.working_hours || null,
                          description: place.description || null,
                          photo_urls: place.photo_urls || null,
                          price_level: null,
                          indoor_outdoor: place.indoor_outdoor as 'indoor' | 'outdoor' | 'mixed' | null || null,
                          avg_rating: place.average_rating || null,
                          review_count: place.review_count || null,
                          verified: place.verified || null,
                          created_by: null,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          place_type: {
                            id: place.id,
                            slug: place.category,
                            name: place.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            description: null,
                            icon: null,
                            created_at: new Date().toISOString()
                          }
                        }}
                        position={index}
                        source="chatbot"
                        algorithm="recommendation-engine-v2"
                        score={place.final_ranking_score}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Welcome Screen - Shows before recommendations */
            <div className="flex flex-col h-full">
              {/* Welcome Header */}
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">🗺️</span>
                  Interactive Map
                </h3>
                <p className="text-sm text-white/80">
                  Places will appear here as you chat
                </p>
              </div>
              
              {/* Welcome Content */}
              <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-6">🗺️</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Map Ready
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Start describing what you&apos;re looking for and recommended places will appear here with precise locations.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                    💡 Tip: You&apos;ll be able to like, save, or hide places to improve future recommendations!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Map Modal */}
      <MobileMapModal />

      {/* Fullscreen Map Modal */}
      <FullscreenMapModal />
    </>
  );
};