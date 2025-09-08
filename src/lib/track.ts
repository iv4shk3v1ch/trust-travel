/**
 * Analytics Tracking Utility
 * 
 * Provides a simple, lightweight wrapper for tracking user events.
 * Can be easily extended to support multiple analytics providers.
 */

export interface TrackingData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface TrackingEvent {
  event: string;
  timestamp: number;
  data?: TrackingData;
  userId?: string;
  sessionId?: string;
}

// Simple in-memory storage for development
let eventBuffer: TrackingEvent[] = [];

/**
 * Get current user ID from auth context
 * This is a simple implementation - in production you'd integrate with your auth system
 */
function getCurrentUserId(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    // Try to get user ID from localStorage (where auth might store it)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
  } catch {
    // Ignore parsing errors
  }

  return undefined;
}

/**
 * Generate a simple session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-session';
  }

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Main tracking function
 * Tracks events with optional data payload
 */
export function track(event: string, data?: TrackingData): void {
  try {
    const trackingEvent: TrackingEvent = {
      event,
      timestamp: Date.now(),
      data: data || {},
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
    };

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', trackingEvent);
    }

    // Store in buffer
    eventBuffer.push(trackingEvent);

    // In production, you would send this to your analytics service
    sendToAnalyticsService(trackingEvent);

  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Track page views
 */
export function trackPageView(page: string, data?: TrackingData): void {
  track('page_view', {
    page,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    referrer: typeof window !== 'undefined' ? document.referrer : undefined,
    ...data,
  });
}

/**
 * Track user interactions
 */
export function trackClick(element: string, data?: TrackingData): void {
  track('click', {
    element,
    ...data,
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmit(form: string, data?: TrackingData): void {
  track('form_submit', {
    form,
    ...data,
  });
}

/**
 * Track errors
 */
export function trackError(error: string, data?: TrackingData): void {
  track('error', {
    error,
    stack: data?.stack || 'No stack trace available',
    ...data,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, data?: TrackingData): void {
  track('feature_usage', {
    feature,
    ...data,
  });
}

/**
 * Send event to analytics service
 * This is where you'd integrate with Google Analytics, Mixpanel, etc.
 */
function sendToAnalyticsService(event: TrackingEvent): void {
  // Example integrations (commented out for now):
  
  // Google Analytics 4
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', event.event, event.data);
  // }
  
  // Mixpanel
  // if (typeof mixpanel !== 'undefined') {
  //   mixpanel.track(event.event, event.data);
  // }
  
  // Custom API endpoint
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(event),
  // }).catch(console.error);

  // For now, just store locally for development
  if (process.env.NODE_ENV === 'development') {
    try {
      const stored = localStorage.getItem('analytics_events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);
      
      // Keep only last 100 events to avoid storage issues
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store analytics event locally:', error);
    }
  }
}

/**
 * Get stored events (development only)
 */
export function getStoredEvents(): TrackingEvent[] {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem('analytics_events') || '[]';
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to retrieve stored events:', error);
    return [];
  }
}

/**
 * Clear stored events (development only)
 */
export function clearStoredEvents(): void {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('analytics_events');
  eventBuffer = [];
  console.log('Analytics events cleared');
}

/**
 * Get current session statistics
 */
export function getSessionStats(): {
  eventsCount: number;
  sessionId: string;
  userId?: string;
} {
  return {
    eventsCount: eventBuffer.length,
    sessionId: getSessionId(),
    userId: getCurrentUserId(),
  };
}
