/**
 * @jest-environment jsdom
 */

import { isEnabled, setFlag, clearFlag, getAllFlags, debugFlags } from '../flags';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  group: console.group,
  groupEnd: console.groupEnd,
};

beforeEach(() => {
  // Clear localStorage before each test
  mockLocalStorage.clear();
  
  // Clear environment variables
  delete process.env.NEXT_PUBLIC_FLAG_UX_UPGRADES;
  delete process.env.NEXT_PUBLIC_FLAG_TEST_FLAG;
  
  // Mock console methods
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterEach(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

describe('Feature Flags', () => {
  describe('isEnabled', () => {
    it('should return false for unknown flags', () => {
      expect(isEnabled('UNKNOWN_FLAG')).toBe(false);
    });

    it('should return default value for known flags', () => {
      expect(isEnabled('UX_UPGRADES')).toBe(false);
    });

    it('should respect environment variables', () => {
      process.env.NEXT_PUBLIC_FLAG_UX_UPGRADES = 'true';
      expect(isEnabled('UX_UPGRADES')).toBe(true);
      
      process.env.NEXT_PUBLIC_FLAG_UX_UPGRADES = 'false';
      expect(isEnabled('UX_UPGRADES')).toBe(false);
    });

    it('should prioritize localStorage over environment variables', () => {
      process.env.NEXT_PUBLIC_FLAG_UX_UPGRADES = 'true';
      mockLocalStorage.setItem('feature_flag_UX_UPGRADES', 'false');
      
      expect(isEnabled('UX_UPGRADES')).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = jest.fn(() => {
        throw new Error('localStorage error');
      });

      expect(isEnabled('UX_UPGRADES')).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read feature flag from localStorage'),
        expect.any(Error)
      );

      mockLocalStorage.getItem = originalGetItem;
    });
  });

  describe('setFlag', () => {
    it('should set flag in localStorage', () => {
      setFlag('UX_UPGRADES', true);
      expect(mockLocalStorage.getItem('feature_flag_UX_UPGRADES')).toBe('true');
      expect(console.log).toHaveBeenCalledWith('Feature flag UX_UPGRADES set to true');
    });

    it('should handle localStorage errors', () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('localStorage error');
      });

      setFlag('UX_UPGRADES', true);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to set feature flag UX_UPGRADES:',
        expect.any(Error)
      );

      mockLocalStorage.setItem = originalSetItem;
    });
  });

  describe('clearFlag', () => {
    it('should remove flag from localStorage', () => {
      mockLocalStorage.setItem('feature_flag_UX_UPGRADES', 'true');
      clearFlag('UX_UPGRADES');
      
      expect(mockLocalStorage.getItem('feature_flag_UX_UPGRADES')).toBeNull();
      expect(console.log).toHaveBeenCalledWith('Feature flag UX_UPGRADES cleared from localStorage');
    });

    it('should handle localStorage errors', () => {
      const originalRemoveItem = mockLocalStorage.removeItem;
      mockLocalStorage.removeItem = jest.fn(() => {
        throw new Error('localStorage error');
      });

      clearFlag('UX_UPGRADES');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear feature flag UX_UPGRADES:',
        expect.any(Error)
      );

      mockLocalStorage.removeItem = originalRemoveItem;
    });
  });

  describe('getAllFlags', () => {
    it('should return all flags with their current values', () => {
      process.env.NEXT_PUBLIC_FLAG_UX_UPGRADES = 'true';
      mockLocalStorage.setItem('feature_flag_BETA_FEATURES', 'true');
      
      const flags = getAllFlags();
      
      expect(flags.UX_UPGRADES).toBe(true);
      expect(flags.BETA_FEATURES).toBe(true);
      expect(flags.ADVANCED_ANALYTICS).toBe(false);
    });
  });

  describe('debugFlags', () => {
    it('should log flags in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      debugFlags();

      expect(console.group).toHaveBeenCalledWith('🚩 Feature Flags Status');
      expect(console.groupEnd).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log flags in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      debugFlags();

      expect(console.group).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('Server-side environment', () => {
  const originalWindow = global.window;

  beforeAll(() => {
    // @ts-ignore
    delete global.window;
  });

  afterAll(() => {
    global.window = originalWindow;
  });

  it('should work without localStorage on server', () => {
    expect(isEnabled('UX_UPGRADES')).toBe(false);
  });

  it('should warn when trying to setFlag on server', () => {
    setFlag('UX_UPGRADES', true);
    expect(console.warn).toHaveBeenCalledWith('setFlag can only be used in browser environment');
  });

  it('should warn when trying to clearFlag on server', () => {
    clearFlag('UX_UPGRADES');
    expect(console.warn).toHaveBeenCalledWith('clearFlag can only be used in browser environment');
  });
});
