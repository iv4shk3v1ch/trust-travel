'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastData } from './Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showProfileBoostToast: (field: string, delta: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [recentToasts, setRecentToasts] = useState<Set<string>>(new Set());

  const generateId = () => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = generateId();
    const toast: ToastData = {
      id,
      duration: 5000, // Default 5 seconds
      type: 'success',
      ...toastData
    };

    setToasts(prev => [...prev, toast]);
  }, []);

  const getFieldMessage = (field: string, delta: number): { message: string; emoji: string } => {
    const messages: Record<string, { message: string; emoji: string }> = {
      // Basic Info
      firstName: {
        message: "Great! Now your recommendations will feel more personal 👋",
        emoji: "👋"
      },
      lastName: {
        message: "Perfect! Your profile is looking more complete 📝",
        emoji: "📝"
      },
      gender: {
        message: "Thanks! This helps us tailor experiences just for you ✨",
        emoji: "✨"
      },
      ageGroup: {
        message: "Awesome! We'll suggest age-appropriate activities in Trento 🎯",
        emoji: "🎯"
      },

      // Preferences
      activities: {
        message: "Now we'll recommend more hidden hiking trails near Trento 🌲",
        emoji: "🌲"
      },
      placeTypes: {
        message: "Excellent! We'll find the perfect spots that match your vibe 🗺️",
        emoji: "🗺️"
      },

      // Food & Restrictions
      foodExcitement: {
        message: "Delicious! We'll suggest the best local eateries in Trento 🍝",
        emoji: "🍝"
      },
      restrictions: {
        message: "Got it! We'll only recommend safe dining options for you 🛡️",
        emoji: "🛡️"
      },
      placesToAvoid: {
        message: "Noted! We'll steer clear of those areas in your itinerary 🚫",
        emoji: "🚫"
      },

      // Personality & Style
      travelPersonality: {
        message: "Perfect! We'll match you with like-minded travel experiences 🌟",
        emoji: "🌟"
      },
      planningStyle: {
        message: "Great! Your itineraries will match your planning preferences 📅",
        emoji: "📅"
      },

      // Budget
      spendingStyle: {
        message: "Smart! We'll recommend options that fit your budget perfectly 💰",
        emoji: "💰"
      },
      travelWith: {
        message: "Wonderful! We'll suggest activities perfect for your travel group 👥",
        emoji: "👥"
      }
    };

    const defaultMessage = {
      message: `Profile updated! Your recommendations just got ${delta} points better 🚀`,
      emoji: "🚀"
    };

    return messages[field] || defaultMessage;
  };

  const showProfileBoostToast = useCallback((field: string, delta: number) => {
    // Only show toast for meaningful changes (delta > 0)
    if (delta <= 0) return;

    // Create deduplication key
    const dedupeKey = `${field}-${Date.now() - (Date.now() % 2000)}`; // 2-second window
    
    // Check if we've shown this recently
    if (recentToasts.has(dedupeKey)) return;

    // Track the analytics event
    if (typeof window !== 'undefined') {
      try {
        // Dynamic import for analytics tracking
        import('@/lib/track').then(({ track }) => {
          track('profile_boost', { field, delta });
        });
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    }

    // Add to recent toasts
    setRecentToasts(prev => new Set([...prev, dedupeKey]));

    // Clean up old entries after 3 seconds
    setTimeout(() => {
      setRecentToasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(dedupeKey);
        return newSet;
      });
    }, 3000);

    const { message, emoji } = getFieldMessage(field, delta);
    
    showToast({
      message,
      emoji,
      type: 'success',
      duration: 4000 // Slightly shorter for profile boosts
    });
  }, [showToast, recentToasts]);

  return (
    <ToastContext.Provider value={{ showToast, showProfileBoostToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              position: 'fixed',
              top: `${16 + index * 80}px`, // Stack toasts
              right: '16px',
              zIndex: 1000 + index
            }}
          >
            <Toast toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
