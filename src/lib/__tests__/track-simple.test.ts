/**
 * @jest-environment jsdom
 */

import { track, trackClick } from '../track';

describe('Analytics Tracking', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Spy on console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('track', () => {
    it('should track basic events without throwing errors', () => {
      expect(() => track('test_event')).not.toThrow();
    });

    it('should track events with data without throwing errors', () => {
      const eventData = { userId: '123', action: 'click' };
      expect(() => track('test_event', eventData)).not.toThrow();
    });

    it('should generate session ID', () => {
      track('test_event');
      const sessionId = sessionStorage.getItem('analytics_session_id');
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('trackClick', () => {
    it('should track click events without throwing errors', () => {
      expect(() => trackClick('header_logo')).not.toThrow();
    });

    it('should track click events with data', () => {
      expect(() => trackClick('header_logo', { section: 'navigation' })).not.toThrow();
    });
  });
});
