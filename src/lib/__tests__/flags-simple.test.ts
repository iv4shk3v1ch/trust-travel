/**
 * @jest-environment jsdom
 */

import { isEnabled, setFlag, clearFlag } from '../flags';

describe('Feature Flags', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('isEnabled', () => {
    it('should return false for unknown flags', () => {
      expect(isEnabled('UNKNOWN_FLAG')).toBe(false);
    });

    it('should return default value for known flags', () => {
      expect(isEnabled('UX_UPGRADES')).toBe(false);
    });

    it('should work with localStorage override', () => {
      localStorage.setItem('feature_flag_UX_UPGRADES', 'true');
      expect(isEnabled('UX_UPGRADES')).toBe(true);
      
      localStorage.setItem('feature_flag_UX_UPGRADES', 'false');
      expect(isEnabled('UX_UPGRADES')).toBe(false);
    });
  });

  describe('setFlag', () => {
    it('should set flag in localStorage', () => {
      setFlag('UX_UPGRADES', true);
      expect(localStorage.getItem('feature_flag_UX_UPGRADES')).toBe('true');
      expect(isEnabled('UX_UPGRADES')).toBe(true);
    });
  });

  describe('clearFlag', () => {
    it('should remove flag from localStorage', () => {
      localStorage.setItem('feature_flag_UX_UPGRADES', 'true');
      expect(isEnabled('UX_UPGRADES')).toBe(true);
      
      clearFlag('UX_UPGRADES');
      
      expect(localStorage.getItem('feature_flag_UX_UPGRADES')).toBeNull();
      expect(isEnabled('UX_UPGRADES')).toBe(false);
    });
  });
});
