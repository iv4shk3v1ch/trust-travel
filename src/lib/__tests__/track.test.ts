/**
 * @jest-environment jsdom
 */

import { 
  track, 
  trackPageView, 
  trackClick, 
  trackFormSubmit, 
  trackError, 
  trackFeatureUsage,
  getStoredEvents,
  clearStoredEvents,
  getSessionStats
} from '../track';

// Mock localStorage and sessionStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock console methods
const consoleSpy = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

beforeEach(() => {
  // Clear storage before each test
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  
  // Mock console
  jest.spyOn(console, 'log').mockImplementation(consoleSpy.log);
  jest.spyOn(console, 'error').mockImplementation(consoleSpy.error);
  jest.spyOn(console, 'warn').mockImplementation(consoleSpy.warn);
  
  // Clear console mocks
  consoleSpy.log.mockClear();
  consoleSpy.error.mockClear();
  consoleSpy.warn.mockClear();
  
  // Set development mode
  const originalEnv = process.env.NODE_ENV;
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'development',
    writable: true,
    configurable: true,
  });
  
  // Store original for restoration
  (global as typeof global & { originalNodeEnv?: string }).originalNodeEnv = originalEnv;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Analytics Tracking', () => {
  describe('track', () => {
    it('should track basic events', () => {
      track('test_event');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.objectContaining({
          event: 'test_event',
          timestamp: expect.any(Number),
          data: {},
          sessionId: expect.any(String),
        })
      );
    });

    it('should track events with data', () => {
      const eventData = { userId: '123', action: 'click' };
      track('test_event', eventData);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.objectContaining({
          event: 'test_event',
          data: eventData,
        })
      );
    });

    it('should generate session ID', () => {
      track('test_event');
      
      const sessionId = mockSessionStorage.getItem('analytics_session_id');
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should reuse existing session ID', () => {
      track('event1');
      const firstSessionId = mockSessionStorage.getItem('analytics_session_id');
      
      track('event2');
      const secondSessionId = mockSessionStorage.getItem('analytics_session_id');
      
      expect(firstSessionId).toBe(secondSessionId);
    });

    it('should handle tracking errors gracefully', () => {
      // Mock an error in the tracking function
      const originalJSON = JSON.stringify;
      JSON.stringify = jest.fn(() => {
        throw new Error('JSON error');
      });

      track('test_event');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to track event:',
        expect.any(Error)
      );

      JSON.stringify = originalJSON;
    });
  });

  describe('trackPageView', () => {
    it('should track page views with URL data', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/test' },
        writable: true,
      });

      trackPageView('/test');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.objectContaining({
          event: 'page_view',
          data: expect.objectContaining({
            page: '/test',
            url: 'https://example.com/test',
          }),
        })
      );
    });
  });

  describe('trackClick', () => {
    it('should track click events', () => {
      trackClick('header_logo', { section: 'navigation' });
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.objectContaining({
          event: 'click',
          data: expect.objectContaining({
            element: 'header_logo',
            section: 'navigation',
          }),
        })
      );
    });
  });

  describe('trackFormSubmit', () => {
    it('should track form submissions', () => {
      trackFormSubmit('login_form', { method: 'email' });
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.objectContaining({
          event: 'form_submit',
          data: expect.objectContaining({
            form: 'login_form',
            method: 'email',
          }),
        })
      );
    });
  });

  describe('trackError', () => {
    it('should track errors', () => {
      trackError('validation_error', { field: 'email' });
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.objectContaining({
          event: 'error',
          data: expect.objectContaining({
            error: 'validation_error',
            field: 'email',
            stack: 'No stack trace available',
          }),
        })
      );
    });
  });

  describe('trackFeatureUsage', () => {
    it('should track feature usage', () => {
      trackFeatureUsage('dark_mode_toggle', { enabled: true });
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.objectContaining({
          event: 'feature_usage',
          data: expect.objectContaining({
            feature: 'dark_mode_toggle',
            enabled: true,
          }),
        })
      );
    });
  });

  describe('getStoredEvents', () => {
    it('should return stored events in development', () => {
      track('event1');
      track('event2');
      
      const events = getStoredEvents();
      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('event1');
      expect(events[1].event).toBe('event2');
    });

    it('should return empty array in production', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });
      
      track('event1');
      
      const events = getStoredEvents();
      expect(events).toHaveLength(0);
      
      // Restore original environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('clearStoredEvents', () => {
    it('should clear stored events in development', () => {
      track('event1');
      track('event2');
      
      clearStoredEvents();
      
      const events = getStoredEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', () => {
      track('event1');
      track('event2');
      
      const stats = getSessionStats();
      expect(stats).toEqual({
        eventsCount: expect.any(Number),
        sessionId: expect.any(String),
        userId: undefined,
      });
    });
  });
});

describe('Server-side environment', () => {
  const originalWindow = global.window;

  beforeAll(() => {
    // @ts-expect-error - Deleting window for server-side testing
    delete global.window;
  });

  afterAll(() => {
    global.window = originalWindow;
  });

  it('should work without window object', () => {
    expect(() => track('server_event')).not.toThrow();
  });

  it('should return empty array for getStoredEvents on server', () => {
    const events = getStoredEvents();
    expect(events).toHaveLength(0);
  });
});
