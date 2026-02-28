import { RecommendedPlace } from '@/core/services/recommendationEngineV2';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  places?: RecommendedPlace[]; // Places attached to this message
}

export interface ChatbotPreferences {
  categories: string[];
  experienceTags: string[];
  destination: string;
  budget?: 'low' | 'medium' | 'high'; // Made optional - now using price_category
  price_category?: 'budget' | 'moderate' | 'expensive' | 'luxury'; // NEW: replaces budget
  summary: string;
  intent?: 'goal-oriented' | 'discovery' | 'informational'; // Added: parsed from chatbot JSON response
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  preferences?: ChatbotPreferences;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}