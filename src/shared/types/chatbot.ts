export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatbotPreferences {
  categories: string[];
  experienceTags: string[];
  destination: string;
  budget: 'low' | 'medium' | 'high';
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